import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Edit2, Trash2, MoreVertical, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import api from '../../services/api';

/**
 * TaskComments Component
 * Displays and manages comments for a task with @mention support
 */
const TaskComments = ({ taskId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showMenu, setShowMenu] = useState(null);
  const textareaRef = useRef(null);

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Fetch comments
  useEffect(() => {
    fetchComments();
  }, [taskId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/tasks/${taskId}/comments`);

      if (response.data.success) {
        setComments(response.data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  // Create new comment
  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!newComment.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post(`/api/tasks/${taskId}/comments`, {
        content: newComment
      });

      if (response.data.success) {
        setComments([...comments, response.data.comment]);
        setNewComment('');
        toast.success('Comment added successfully');
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  // Start editing comment
  const handleStartEdit = (comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
    setShowMenu(null);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  // Update comment
  const handleUpdateComment = async (commentId) => {
    if (!editContent.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.put(`/api/tasks/${taskId}/comments/${commentId}`, {
        content: editContent
      });

      if (response.data.success) {
        setComments(comments.map(c =>
          c.id === commentId ? response.data.comment : c
        ));
        setEditingCommentId(null);
        setEditContent('');
        toast.success('Comment updated successfully');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const response = await api.delete(`/api/tasks/${taskId}/comments/${commentId}`);

      if (response.data.success) {
        setComments(comments.filter(c => c.id !== commentId));
        toast.success('Comment deleted successfully');
        setShowMenu(null);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    try {
      return format(new Date(timestamp), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return timestamp;
    }
  };

  // Get user initials for avatar
  const getUserInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  // Check if user can edit/delete comment
  const canModifyComment = (comment) => {
    return comment.userId === currentUser.id || currentUser.role === 'Admin';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Comments Header */}
      <div className="flex items-center gap-2 text-gray-700 font-medium">
        <MessageCircle size={20} />
        <span>Comments ({comments.length})</span>
      </div>

      {/* Comments List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 rounded-lg p-4 relative group">
              {/* Comment Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  {/* User Avatar */}
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                    {getUserInitials(comment.userName)}
                  </div>

                  {/* User Info */}
                  <div>
                    <div className="font-medium text-gray-900">
                      {comment.userName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTimestamp(comment.createdAt)}
                      {comment.isEdited && (
                        <span className="ml-1 text-gray-400">(edited)</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Menu */}
                {canModifyComment(comment) && (
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(showMenu === comment.id ? null : comment.id)}
                      className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical size={16} className="text-gray-500" />
                    </button>

                    {showMenu === comment.id && (
                      <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
                        <button
                          onClick={() => handleStartEdit(comment)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Edit2 size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Comment Content */}
              {editingCommentId === comment.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    placeholder="Edit your comment..."
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateComment(comment.id)}
                      disabled={submitting || !editContent.trim()}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submitting ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* New Comment Form */}
      <form onSubmit={handleSubmitComment} className="space-y-2">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment... (Use @ to mention someone)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
          />
          <div className="absolute bottom-3 right-3 text-xs text-gray-400">
            Tip: Use @username to mention someone
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {newComment.length} characters
          </span>
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Posting...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>Post Comment</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskComments;
