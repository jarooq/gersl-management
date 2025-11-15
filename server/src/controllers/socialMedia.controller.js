import { Op } from 'sequelize';
import { SocialMediaPost, SocialMediaEngagement, Campaign, User } from '../models/index.js';
import { asyncHandler, NotFoundError } from '../middleware/error.middleware.js';

export const getAllSocialMediaPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status, campaignId } = req.query;
  const offset = (page - 1) * limit;
  const where = {};

  if (search) {
    where[Op.or] = [
      { postCode: { [Op.iLike]: `%${search}%` } },
      { title: { [Op.iLike]: `%${search}%` } },
      { content: { [Op.iLike]: `%${search}%` } }
    ];
  }
  if (status) where.status = status;
  if (campaignId) where.campaignId = campaignId;

  const { count, rows: posts } = await SocialMediaPost.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['scheduledTime', 'DESC']],
    include: [
      { model: Campaign, as: 'campaign', attributes: ['id', 'title', 'campaignCode'] },
      { model: User, as: 'creator', attributes: ['id', 'fullName'] }
    ]
  });

  res.json({
    success: true,
    data: {
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        limit: parseInt(limit)
      }
    }
  });
});

export const getSocialMediaPostById = asyncHandler(async (req, res) => {
  const post = await SocialMediaPost.findByPk(req.params.id, {
    include: [
      { model: Campaign, as: 'campaign' },
      { model: User, as: 'creator', attributes: ['id', 'fullName'] },
      { model: SocialMediaEngagement, as: 'engagements' }
    ]
  });

  if (!post) throw new NotFoundError('Social media post not found');
  res.json({ success: true, data: { post } });
});

export const createSocialMediaPost = asyncHandler(async (req, res) => {
  const postData = req.body;

  if (!postData.postCode) {
    const year = new Date().getFullYear();
    const count = await SocialMediaPost.count();
    postData.postCode = `POST-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  // Initialize engagement stats if not provided
  if (!postData.engagementStats) {
    postData.engagementStats = { likes: 0, shares: 0, comments: 0, views: 0 };
  }

  if (req.user) postData.createdBy = req.user.id;

  const post = await SocialMediaPost.create(postData);
  res.status(201).json({ success: true, message: 'Social media post created successfully', data: { post } });
});

export const updateSocialMediaPost = asyncHandler(async (req, res) => {
  const post = await SocialMediaPost.findByPk(req.params.id);
  if (!post) throw new NotFoundError('Social media post not found');

  await post.update(req.body);
  res.json({ success: true, message: 'Social media post updated successfully', data: { post } });
});

export const publishPost = asyncHandler(async (req, res) => {
  const post = await SocialMediaPost.findByPk(req.params.id);
  if (!post) throw new NotFoundError('Social media post not found');

  await post.update({
    status: 'Published',
    publishedTime: new Date()
  });

  res.json({ success: true, message: 'Post published successfully', data: { post } });
});

export const deleteSocialMediaPost = asyncHandler(async (req, res) => {
  const post = await SocialMediaPost.findByPk(req.params.id);
  if (!post) throw new NotFoundError('Social media post not found');

  await post.destroy();
  res.json({ success: true, message: 'Social media post deleted successfully' });
});

export const getSocialMediaStats = asyncHandler(async (req, res) => {
  const total = await SocialMediaPost.count();
  const draft = await SocialMediaPost.count({ where: { status: 'Draft' } });
  const scheduled = await SocialMediaPost.count({ where: { status: 'Scheduled' } });
  const published = await SocialMediaPost.count({ where: { status: 'Published' } });

  // Get total engagement
  const posts = await SocialMediaPost.findAll({
    where: { status: 'Published' },
    attributes: ['engagementStats']
  });

  let totalLikes = 0, totalShares = 0, totalComments = 0, totalViews = 0;
  posts.forEach(post => {
    if (post.engagementStats) {
      totalLikes += post.engagementStats.likes || 0;
      totalShares += post.engagementStats.shares || 0;
      totalComments += post.engagementStats.comments || 0;
      totalViews += post.engagementStats.views || 0;
    }
  });

  res.json({
    success: true,
    data: {
      total, draft, scheduled, published,
      engagement: {
        totalLikes,
        totalShares,
        totalComments,
        totalViews
      }
    }
  });
});

// Engagement tracking
export const recordEngagement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { platform, engagementType, engagementCount } = req.body;

  const post = await SocialMediaPost.findByPk(id);
  if (!post) throw new NotFoundError('Social media post not found');

  // Create engagement record
  const engagement = await SocialMediaEngagement.create({
    postId: id,
    platform,
    engagementType,
    engagementCount,
    engagementDate: new Date()
  });

  // Update post engagement stats
  const stats = post.engagementStats || { likes: 0, shares: 0, comments: 0, views: 0 };
  if (engagementType in stats) {
    stats[engagementType] = (stats[engagementType] || 0) + parseInt(engagementCount);
  }

  await post.update({ engagementStats: stats });

  res.json({ success: true, message: 'Engagement recorded successfully', data: { engagement, post } });
});
