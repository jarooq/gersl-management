// =============================================================================
// Programme stage → auto-task helper
//
// When a WASH or IGP item advances to a new stage, the system spawns a Task
// for the NEXT operational step. The task is assigned to a sensible default
// (the item's supervisor, or the user who made the transition if no
// supervisor is set) and given a due date relative to the order deadline.
//
// Best-effort: never throws back to the transition handler — a missed task
// shouldn't block a field officer from updating the stage.
// =============================================================================

import { Op } from 'sequelize';
import { Task } from '../models/index.js';

// Define the workflow step that follows each stage transition. Keys are the
// stage you've JUST entered; values describe the task that should be created
// to drive progress toward the NEXT stage.
const WASH_NEXT_TASK = {
  Surveyed:     { title: 'Raise materials PR',           description: 'Survey complete — raise a procurement requisition for installation materials.', dueOffsetDays: 5,  priority: 'High'   },
  Materials:    { title: 'Begin construction',           description: 'Materials are in. Coordinate with the contractor and begin construction on site.', dueOffsetDays: 7,  priority: 'High'   },
  Construction: { title: 'Schedule quality testing',     description: 'Construction phase ongoing — schedule water-quality testing with the MEAL officer.', dueOffsetDays: 5,  priority: 'Medium' },
  Testing:      { title: 'Conduct beneficiary handover', description: 'Quality test passed — organise formal handover with beneficiary signature and photos.', dueOffsetDays: 3, priority: 'High' },
  HandedOver:   { title: 'Generate donor report',        description: 'Handover complete — finalise the per-installation donor report and attach final photos.', dueOffsetDays: 7, priority: 'Medium' },
};

const IGP_NEXT_TASK = {
  Surveyed:  { title: 'Procure asset',              description: 'Survey complete — raise a PR/PO for the asset and arrange supplier delivery.', dueOffsetDays: 7,  priority: 'High'   },
  Procured:  { title: 'Schedule training',          description: 'Asset procured. If training is required, schedule the session with the trainer.', dueOffsetDays: 5,  priority: 'Medium' },
  Training:  { title: 'Deliver asset to beneficiary', description: 'Training complete — deliver the asset to the beneficiary, capture signature + GPS.', dueOffsetDays: 3, priority: 'High'   },
  Delivered: { title: 'Schedule income follow-up',  description: 'Asset delivered — schedule a follow-up visit in 30-90 days to capture income uplift.', dueOffsetDays: 30, priority: 'Low' },
  FollowUp:  { title: 'Generate donor report',      description: 'Follow-up complete — finalise the donor report including income comparison.', dueOffsetDays: 7,  priority: 'Medium' },
};

// Compute a due date by offsetting from today, clamped not to exceed the
// order deadline. Returns a YYYY-MM-DD string.
const dueDateFor = (offsetDays, orderDeadline) => {
  const offset = new Date();
  offset.setUTCDate(offset.getUTCDate() + offsetDays);
  const offsetStr = offset.toISOString().slice(0, 10);
  if (!orderDeadline) return offsetStr;
  return offsetStr > String(orderDeadline) ? String(orderDeadline) : offsetStr;
};

const taskCodeFromId = (id) => `T-AUTO-${String(id).padStart(6, '0')}`;
const tempTaskCode  = () => `T-AUTO-TMP-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/**
 * Create the next-stage task for a programme item. Caller passes the item
 * (with its `order` association already loaded), the kind ('wash' | 'igp'),
 * the just-entered stage, and the user who triggered the transition.
 *
 * Returns the created Task or null when no auto-task is defined for that
 * stage. Never throws.
 */
export const createNextStageTask = async ({ kind, item, newStage, triggeredBy }) => {
  try {
    const map = kind === 'wash' ? WASH_NEXT_TASK : IGP_NEXT_TASK;
    const tpl = map[newStage];
    if (!tpl) return null;

    const order = item.order; // populated by the controller before calling us
    const assignTo = item.assignedSupervisorId || triggeredBy || null;
    const dueDate  = dueDateFor(tpl.dueOffsetDays, order?.deadline);
    const itemCode = item.itemCode || `#${item.id}`;
    const beneficiary = item.beneficiaryName || 'beneficiary';

    // Idempotency: if the same item already has an open task for this exact
    // stage (e.g. a previous transition that got reverted and re-applied),
    // don't pile up duplicates. Match on the item-code-suffixed title plus
    // a non-terminal status.
    const existing = await Task.findOne({
      where: {
        title:  { [Op.like]: `${tpl.title} — ${itemCode}` },
        status: { [Op.notIn]: ['Completed', 'Cancelled'] },
      },
    });
    if (existing) return existing;

    // Create with a placeholder code, then patch with the real id-derived one
    // so the code is unique and predictable even under concurrent writes.
    const task = await Task.create({
      taskCode:    tempTaskCode(),
      projectId:   order?.projectId || null,
      title:       `${tpl.title} — ${itemCode}`,
      description: `${tpl.description}\n\n${itemCode} · ${beneficiary} (${kind.toUpperCase()})`,
      assignedTo:  assignTo,
      assignedBy:  triggeredBy || null,
      assignedAt:  new Date(),
      dueDate,
      priority:    tpl.priority,
      status:      'Pending',
      progress:    0,
    });
    await task.update({ taskCode: taskCodeFromId(task.id) });
    return task;
  } catch (err) {
    console.error('[programmeTasks] failed to create next-stage task:', err.message);
    return null;
  }
};
