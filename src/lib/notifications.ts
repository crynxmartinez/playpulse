import { prisma } from '@/lib/prisma'

// NotificationType enum values
type NotificationType = 'FEEDBACK_COMMENT' | 'FEEDBACK_STATUS' | 'FEEDBACK_REPLY' | 'UPDATE_PUBLISHED' | 'FORM_RELEASED'

interface NotifyFollowersParams {
  projectId: string
  type: NotificationType
  title: string
  message: string
  link?: string
  excludeUserId?: string // Don't notify the user who triggered the action
}

// Send notification to all followers of a project
export async function notifyFollowers({
  projectId,
  type,
  title,
  message,
  link,
  excludeUserId
}: NotifyFollowersParams) {
  try {
    // Get all followers of this project
    const followers = await prisma.projectFollower.findMany({
      where: { projectId },
      select: { userId: true }
    })

    // Filter out the user who triggered the action
    const userIds = followers
      .map(f => f.userId)
      .filter(id => id !== excludeUserId)

    if (userIds.length === 0) return

    // Create notifications for all followers
    await prisma.notification.createMany({
      data: userIds.map(userId => ({
        userId,
        type,
        title,
        message,
        link
      }))
    })

    return userIds.length
  } catch (error) {
    console.error('Error notifying followers:', error)
    throw error
  }
}

// Send notification to a specific user
export async function notifyUser({
  userId,
  type,
  title,
  message,
  link
}: {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
}) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link
      }
    })
  } catch (error) {
    console.error('Error notifying user:', error)
    throw error
  }
}

// Notify when a new update is published
export async function notifyUpdatePublished(
  projectId: string,
  projectName: string,
  updateTitle: string,
  publisherId: string
) {
  return notifyFollowers({
    projectId,
    type: 'UPDATE_PUBLISHED',
    title: `New update from ${projectName}`,
    message: updateTitle,
    link: `/game/${projectId}`,
    excludeUserId: publisherId
  })
}

// Notify when a new form is released
export async function notifyFormReleased(
  projectId: string,
  projectName: string,
  formTitle: string,
  formSlug: string | null,
  publisherId: string
) {
  return notifyFollowers({
    projectId,
    type: 'FORM_RELEASED',
    title: `New playtest from ${projectName}`,
    message: formTitle,
    link: `/f/${formSlug || projectId}`,
    excludeUserId: publisherId
  })
}

// Notify when someone replies to your comment/thread
export async function notifyCommentReply(
  authorId: string,
  replierName: string,
  projectId: string,
  threadId: string
) {
  return notifyUser({
    userId: authorId,
    type: 'FEEDBACK_COMMENT',
    title: 'New reply to your comment',
    message: `${replierName} replied to your comment`,
    link: `/game/${projectId}?tab=feedback&thread=${threadId}`
  })
}

// Notify thread participants when someone else replies
export async function notifyThreadParticipants(
  threadId: string,
  projectId: string,
  replierName: string,
  excludeUserIds: string[] // Don't notify the replier and thread author
) {
  try {
    // Get all unique participants in this thread (commenters)
    const comments = await prisma.feedbackComment.findMany({
      where: { threadId },
      select: { authorId: true },
      distinct: ['authorId']
    })

    const participantIds = comments
      .map(c => c.authorId)
      .filter(id => !excludeUserIds.includes(id))

    if (participantIds.length === 0) return

    await prisma.notification.createMany({
      data: participantIds.map(userId => ({
        userId,
        type: 'FEEDBACK_REPLY' as NotificationType,
        title: 'New reply in a thread you participated in',
        message: `${replierName} added a comment`,
        link: `/game/${projectId}?tab=feedback&thread=${threadId}`
      }))
    })

    return participantIds.length
  } catch (error) {
    console.error('Error notifying thread participants:', error)
    throw error
  }
}
