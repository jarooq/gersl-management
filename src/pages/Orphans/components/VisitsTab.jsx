import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Star, Image, Mail, FileText, Eye, Loader, Plus, Trash2, Package, AlertCircle } from 'lucide-react';
import { VisitLogAPI } from '../../../services/api';
import VisitLogModal from './VisitLogModal';

const VisitsTab = ({ orphan }) => {
  const [visitLogs, setVisitLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const fetchVisitLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await VisitLogAPI.getByOrphan(orphan.id);
      setVisitLogs(data.visitLogs || []);
    } catch (error) {
      console.error('Error fetching visit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [orphan?.id]);

  useEffect(() => {
    if (orphan?.id) {
      fetchVisitLogs();
    }
  }, [orphan?.id, fetchVisitLogs]);

  const handleDeleteVisit = async (visitId) => {
    if (!window.confirm('Are you sure you want to delete this visit log?')) {
      return;
    }

    try {
      await VisitLogAPI.delete(visitId);
      alert('Visit log deleted successfully!');
      fetchVisitLogs();
    } catch (error) {
      console.error('Error deleting visit log:', error);
      alert('Failed to delete visit log. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader className="w-8 h-8 text-pink-600 animate-spin" />
        <span className="ml-3 text-ink-600">Loading visit logs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-100 rounded-lg">
            <Calendar size={24} className="text-pink-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-ink-900">Visit History</h3>
            <p className="text-sm text-ink-600">{visitLogs.length} total visits recorded</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg transition text-sm font-semibold shadow-md"
        >
          <Plus size={18} />
          Add Visit Log
        </button>
      </div>

      {visitLogs.length > 0 ? (
        <div className="space-y-4">
          {visitLogs.map((visit) => (
            <VisitLogCard
              key={visit.id}
              visit={visit}
              onDelete={handleDeleteVisit}
              onImageClick={setSelectedImage}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-ink-50 rounded-xl border-2 border-dashed border-ink-300">
          <Calendar className="w-16 h-16 text-pink-400 mx-auto mb-4" />
          <p className="text-ink-900 font-semibold mb-1 text-lg">No visits recorded yet</p>
          <p className="text-ink-600 text-sm mb-6">Start tracking visits to monitor {orphan?.fullName}'s progress</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg transition text-sm font-semibold shadow-md"
          >
            <Plus size={18} className="inline mr-2" />
            Add First Visit Log
          </button>
        </div>
      )}

      {/* Visit Log Modal */}
      <VisitLogModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        orphan={orphan}
        onSuccess={() => {
          fetchVisitLogs();
          setShowModal(false);
        }}
      />

      {/* Image Lightbox */}
      {selectedImage && (
        <ImageLightbox
          src={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
};

const VisitLogCard = ({ visit, onDelete, onImageClick }) => {

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const rating = visit.rating || {};
  const hasRating = rating.educationalProgress || rating.healthWellbeing || rating.socialDevelopment || rating.behavioralProgress;

  return (
    <div className="bg-white border-2 border-ink-100 rounded-xl p-6 hover:shadow-card transition-all duration-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h4 className="font-bold text-lg text-ink-900">{formatDate(visit.visitDate)}</h4>
            {visit.rating?.overallRating && (
              <div className="flex items-center gap-1 px-3 py-1 bg-ink-50 border border-amber-200 rounded-full">
                <Star size={14} className="text-amber-500 fill-amber-500" />
                <span className="text-sm font-bold text-amber-700">{parseFloat(visit.rating.overallRating).toFixed(1)}</span>
              </div>
            )}
          </div>
          <p className="text-sm text-ink-600">
            <span className="font-medium">Coordinator:</span> {visit.coordinator?.fullName || visit.coordinator?.username || 'N/A'}
          </p>
        </div>

        {/* Media Count Badges */}
        <div className="flex items-center gap-2">
          {visit.photos?.length > 0 && (
            <span className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-xs font-bold flex items-center gap-1">
              <Image size={14} />
              {visit.photos.length}
            </span>
          )}
          {visit.drawings?.length > 0 && (
            <span className="px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full text-xs font-bold flex items-center gap-1">
              <Image size={14} />
              {visit.drawings.length}
            </span>
          )}
          {visit.letters?.length > 0 && (
            <span className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-xs font-bold flex items-center gap-1">
              <Mail size={14} />
              {visit.letters.length}
            </span>
          )}
          <button
            onClick={() => onDelete(visit.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete visit log"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Progress Ratings */}
      {hasRating && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {rating.educationalProgress > 0 && (
            <RatingBadge label="Educational" value={rating.educationalProgress} color="blue" />
          )}
          {rating.healthWellbeing > 0 && (
            <RatingBadge label="Health" value={rating.healthWellbeing} color="green" />
          )}
          {rating.socialDevelopment > 0 && (
            <RatingBadge label="Social" value={rating.socialDevelopment} color="purple" />
          )}
          {rating.behavioralProgress > 0 && (
            <RatingBadge label="Behavioral" value={rating.behavioralProgress} color="pink" />
          )}
        </div>
      )}

      {/* Visit Notes */}
      {visit.visitNotes && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2 mb-2">
            <FileText size={16} className="text-blue-600 mt-0.5" />
            <p className="text-xs font-semibold text-blue-900 uppercase">Visit Notes</p>
          </div>
          <p className="text-sm text-ink-700 leading-relaxed">{visit.visitNotes}</p>
        </div>
      )}

      {/* Observations */}
      {visit.observations && (
        <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-start gap-2 mb-2">
            <Eye size={16} className="text-purple-600 mt-0.5" />
            <p className="text-xs font-semibold text-purple-900 uppercase">Observations</p>
          </div>
          <p className="text-sm text-ink-700 leading-relaxed">{visit.observations}</p>
        </div>
      )}

      {/* Rating Notes */}
      {rating.notes && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2 mb-2">
            <Star size={16} className="text-amber-600 mt-0.5" />
            <p className="text-xs font-semibold text-amber-900 uppercase">Progress Notes</p>
          </div>
          <p className="text-sm text-ink-700 leading-relaxed">{rating.notes}</p>
        </div>
      )}

      {/* Needs Assessment */}
      {visit.needsAssessment?.length > 0 && (
        <div className="mb-4 p-4 bg-ink-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2 mb-3">
            <Package size={16} className="text-blue-600 mt-0.5" />
            <p className="text-xs font-semibold text-blue-900 uppercase">Needs Identified</p>
          </div>
          <div className="space-y-2">
            {visit.needsAssessment.map((need, index) => (
              <div key={index} className="bg-white border border-blue-200 rounded-lg p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h5 className="font-semibold text-ink-900 text-sm">{need.needType}</h5>
                  <div className="flex gap-1 flex-shrink-0">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">
                      {need.needCategory}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium border ${
                      need.urgency === 'Critical' ? 'bg-red-100 text-red-700 border-red-300' :
                      need.urgency === 'High' ? 'bg-orange-100 text-orange-700 border-orange-300' :
                      need.urgency === 'Medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                      'bg-ink-100 text-ink-700 border-ink-200'
                    }`}>
                      <AlertCircle size={10} className="inline mr-0.5" />
                      {need.urgency}
                    </span>
                  </div>
                </div>
                {need.description && (
                  <p className="text-xs text-ink-600 mb-2">{need.description}</p>
                )}
                <div className="flex gap-3 text-xs text-ink-700">
                  {need.quantity && <span className="font-medium">Qty: {need.quantity}</span>}
                  {need.estimatedCost && (
                    <span className="font-medium">
                      Est. Cost: LKR {parseFloat(need.estimatedCost).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Media Gallery */}
      {(visit.photos?.length > 0 || visit.drawings?.length > 0 || visit.letters?.length > 0) && (
        <div className="space-y-3">
          {visit.photos?.length > 0 && (
            <MediaSection
              title="Photos from Visit"
              media={visit.photos}
              color="blue"
              onImageClick={onImageClick}
            />
          )}
          {visit.drawings?.length > 0 && (
            <MediaSection
              title="Children's Drawings"
              media={visit.drawings}
              color="purple"
              onImageClick={onImageClick}
            />
          )}
          {visit.letters?.length > 0 && (
            <MediaSection
              title="Letters"
              media={visit.letters}
              color="green"
              onImageClick={onImageClick}
            />
          )}
        </div>
      )}
    </div>
  );
};

const RatingBadge = ({ label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    pink: 'bg-pink-50 border-pink-200'
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-3`}>
      <p className="text-xs text-ink-600 mb-1">{label}</p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={value >= star ? `text-${color}-500 fill-${color}-500` : 'text-ink-300'}
            fill={value >= star ? 'currentColor' : 'none'}
          />
        ))}
      </div>
    </div>
  );
};

const MediaSection = ({ title, media, color, onImageClick }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    green: 'bg-green-50 border-green-200 text-green-900'
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-4`}>
      <p className="text-xs font-semibold uppercase mb-3">{title}</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {media.map((src, index) => (
          <div
            key={index}
            className="relative group cursor-pointer"
            onClick={() => onImageClick(src)}
          >
            <img
              src={src}
              alt={`${title} ${index + 1}`}
              className="w-full h-20 object-cover rounded-lg border-2 border-ink-100 hover:border-pink-400 transition-all group-"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
              }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-all flex items-center justify-center">
              <Eye className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ImageLightbox = ({ src, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-5xl max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <img
          src={src}
          alt="Full size"
          className="max-w-full max-h-[90vh] object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

export default VisitsTab;
