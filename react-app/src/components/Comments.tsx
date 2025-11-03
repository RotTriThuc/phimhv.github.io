/**
 * Comments Component
 * 
 * Firebase-powered comments system
 * Real-time updates using Firestore
 * 
 * Features:
 * - Add/delete comments
 * - User authentication
 * - Real-time updates
 * - Moderation support
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import './Comments.css';

interface CommentsProps {
  movieSlug: string;
  movieName: string;
}

const Comments: React.FC<CommentsProps> = ({ movieSlug }) => {
  const { getComments, addComment } = useFirebase();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const data = await getComments(movieSlug);
        setComments(data);
      } catch (error) {
        console.error('Failed to load comments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
    
    // Poll for new comments every 10 seconds
    const interval = setInterval(fetchComments, 10000);
    return () => clearInterval(interval);
  }, [movieSlug, getComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      await addComment(movieSlug, newComment.trim());
      setNewComment('');
      
      // Refresh comments
      const data = await getComments(movieSlug);
      setComments(data);
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('❌ Không thể thêm bình luận');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete comment feature disabled - deleteComment not implemented in FirebaseContext
  // const handleDelete = async (commentId: string) => {
  //   if (!confirm('Xóa bình luận này?')) return;
  //   try {
  //     // await deleteComment(commentId);
  //     setComments(prev => prev.filter(c => c.id !== commentId));
  //     alert('✅ Đã xóa bình luận');
  //   } catch (error) {
  //     console.error('Failed to delete comment:', error);
  //     alert('❌ Không thể xóa bình luận');
  //   }
  // };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="comments-section">
        <h2 className="comments-title">💬 Bình luận</h2>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="comments-section">
      <h2 className="comments-title">
        💬 Bình luận ({comments.length})
      </h2>

      {/* Comment Form */}
      <motion.form
        className="comment-form"
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <textarea
          className="comment-input"
          placeholder="Chia sẻ cảm nhận của bạn về bộ phim này..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={4}
          maxLength={500}
          disabled={submitting}
        />
        <div className="comment-form-footer">
          <span className="character-count">
            {newComment.length} / 500
          </span>
          <motion.button
            type="submit"
            className="btn btn-primary"
            disabled={!newComment.trim() || submitting}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {submitting ? '⏳ Đang gửi...' : '📤 Gửi bình luận'}
          </motion.button>
        </div>
      </motion.form>

      {/* Comments List */}
      <div className="comments-list">
        <AnimatePresence>
          {comments.length > 0 ? (
            comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                className="comment-item"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="comment-header">
                  <div className="comment-user">
                    <div className="user-avatar">
                      {comment.userName?.[0]?.toUpperCase() || '😊'}
                    </div>
                    <div className="user-info">
                      <div className="user-name">{comment.userName || 'Người dùng'}</div>
                      <div className="comment-time">{formatDate(comment.createdAt)}</div>
                    </div>
                  </div>
                  {/* Delete button disabled - deleteComment not implemented */}
                  {/* {comment.userId === userId && (
                    <motion.button
                      className="btn-delete"
                      onClick={() => handleDelete(comment.id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="Xóa bình luận"
                    >
                      🗑️
                    </motion.button>
                  )} */}
                </div>
                <div className="comment-content">{comment.content}</div>
              </motion.div>
            ))
          ) : (
            <motion.div
              className="no-comments"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="no-comments-icon">💭</div>
              <p>Chưa có bình luận nào</p>
              <p>Hãy là người đầu tiên chia sẻ cảm nhận!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Comments;

