const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { authenticate } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');

router.use(authenticate);
router.use(activityLogger);

// MODULE E1 - Comment Threads Per Section
router.post('/reports/:reportId/comments', reviewController.addComment);
router.get('/reports/:reportId/comments', reviewController.getComments);
router.put('/comments/:commentId', reviewController.updateComment);
router.delete('/comments/:commentId', reviewController.deleteComment);

// Comment Replies
router.post('/comments/:commentId/replies', reviewController.addReply);
router.get('/comments/:commentId/replies', reviewController.getReplies);

// MODULE E2 - Review Actions
router.post('/reports/:reportId/reviews', reviewController.createReview);
router.get('/reports/:reportId/reviews', reviewController.getReviews);
router.put('/reviews/:reviewId', reviewController.updateReview);

// Review Actions
router.post('/reviews/:reviewId/submit', reviewController.submitReview);
router.post('/comments/:commentId/resolve', reviewController.resolveComment);
router.post('/reviews/:reviewId/assign', reviewController.assignReviewer);

// MODULE E3 - Approval & Sign Off
router.post('/reviews/:reviewId/approve', reviewController.approveReview);
router.post('/reviews/:reviewId/reject', reviewController.rejectReview);
router.post('/reviews/:reviewId/sign-off', reviewController.signOff);

// Review Dashboard
router.get('/pending', reviewController.getPendingReviews);
router.get('/my-reviews', reviewController.getMyReviews);

module.exports = router;
