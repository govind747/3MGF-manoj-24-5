import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import NotificationSystem from '../components/FanPage/NotificationSystem';
import UserProfile from '../components/FanPage/UserProfile';
import PostsList from '../components/FanPage/PostsList';
import CreatePostModal from '../components/FanPage/CreatePostModal';
import CommentsModal from '../components/FanPage/CommentsModal';
import TipModal from '../components/FanPage/TipModal';
import { useNotifications } from '../components/FanPage/hooks/useNotifications';
import { usePosts } from '../components/FanPage/hooks/usePosts';
import { useComments } from '../components/FanPage/hooks/useComments';
import { Post, NewPost, EmojiType } from '../components/FanPage/types';

const FanPage: React.FC = () => {
  const { connected, openModal, publicKey } = useWallet();
  const { notifications, addNotification, removeNotification } = useNotifications();
  const { posts, loading, error, fetchPosts, ensureUserExists, handleEmojiReaction } = usePosts();
  const { comments, fetchComments } = useComments();

  const [isPostModalOpen, setPostModalOpen] = useState(false);
  const [isCommentsModalOpen, setCommentsModalOpen] = useState(false);
  const [isTipModalOpen, setTipModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState('');
  const [tipAmount, setTipAmount] = useState(0.01);
  const [newPost, setNewPost] = useState<NewPost>({
    content: '',
    twitter_embed: '',
    website: '',
    facebook: '',
    telegram: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCommentsModal = (post: Post) => {
    setSelectedPost(post);
    setCommentsModalOpen(true);
    fetchComments(post.id);
  };

  const openTipModal = (post: Post) => {
    setSelectedPost(post);
    setTipModalOpen(true);
  };

  const handleEmojiClick = async (postId: string, emojiType: EmojiType) => {
    if (!connected) {
      openModal();
      return;
    }

    try {
      await handleEmojiReaction(postId, emojiType);
    } catch (error) {
      console.error('Error handling emoji reaction:', error);
      addNotification({
        type: 'error',
        message: 'Failed to update reaction. Please try again.'
      });
    }
  };

  const handleSubmitComment = async () => {
    if (!connected || !selectedPost || !newComment.trim()) return;

    try {
      await ensureUserExists(publicKey!.toString());
      
      // Add comment to database (you'll need to implement this in useComments)
      // For now, just clear the comment and refresh
      setNewComment('');
      addNotification({
        type: 'success',
        message: 'Comment added successfully!'
      });
      fetchComments(selectedPost.id);
    } catch (error) {
      console.error('Error submitting comment:', error);
      addNotification({
        type: 'error',
        message: 'Failed to add comment. Please try again.'
      });
    }
  };

  const handleSendTip = async () => {
    if (!connected || !selectedPost) return;

    try {
      // Implement tip sending logic here
      addNotification({
        type: 'success',
        message: `Tip of ${tipAmount} SOL sent successfully!`
      });
      setTipModalOpen(false);
    } catch (error) {
      console.error('Error sending tip:', error);
      addNotification({
        type: 'error',
        message: 'Failed to send tip. Please try again.'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-24 px-4 bg-primary-light dark:bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-purple mx-auto mb-4"></div>
          <p className="text-text-secondary-light dark:text-text-secondary">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-24 px-4 bg-primary-light dark:bg-primary">
      <NotificationSystem 
        notifications={notifications}
        onRemove={removeNotification}
      />

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        <UserProfile 
          connected={connected}
          publicKey={publicKey?.toBase58() || null}
          isSubmitting={isSubmitting}
          onCreatePost={() => setPostModalOpen(true)}
          onConnectWallet={openModal}
        />

        <div className="md:col-span-3">
          <PostsList 
            posts={posts}
            loading={loading}
            error={error}
            connected={connected}
            currentUserWallet={publicKey?.toBase58() || null}
            onEmojiReaction={handleEmojiClick}
            onOpenComments={openCommentsModal}
            onOpenTip={openTipModal}
          />
        </div>
      </div>

      <CreatePostModal
        isOpen={isPostModalOpen}
        newPost={newPost}
        isSubmitting={isSubmitting}
        onClose={() => setPostModalOpen(false)}
        onPostChange={setNewPost}
        onSubmit={async () => {
          // Implement post submission logic
          setIsSubmitting(true);
          try {
            // Add your post submission logic here
            await new Promise(resolve => setTimeout(resolve, 1000)); // Placeholder
            setPostModalOpen(false);
            setNewPost({
              content: '',
              twitter_embed: '',
              website: '',
              facebook: '',
              telegram: ''
            });
            fetchPosts();
            addNotification({
              type: 'success',
              message: 'Post created successfully!'
            });
          } catch {
            addNotification({
              type: 'error',
              message: 'Failed to create post. Please try again.'
            });
          } finally {
            setIsSubmitting(false);
          }
        }}
        transactionStatus={'idle'}
        error={''}
      />

      <CommentsModal
        isOpen={isCommentsModalOpen}
        post={selectedPost}
        comments={comments}
        newComment={newComment}
        connected={connected}
        onClose={() => setCommentsModalOpen(false)}
        onCommentChange={setNewComment}
        onSubmitComment={handleSubmitComment}
      />

      <TipModal
        isOpen={isTipModalOpen}
        post={selectedPost}
        tipAmount={tipAmount}
        onClose={() => setTipModalOpen(false)}
        onTipAmountChange={setTipAmount}
        onSendTip={handleSendTip}
      />
    </div>
  );
};

export default FanPage;