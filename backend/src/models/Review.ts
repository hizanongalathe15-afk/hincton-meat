import { prisma } from '../database'

export interface IReview {
  id: string
  userId: string
  productId: string
  rating: number
  comment: string
  helpful?: number
  createdAt: Date
  updatedAt: Date
}

export const ReviewModel = {
  findById: async (id: string): Promise<IReview | null> => {
    const review = await prisma.review.findUnique({
      where: { id }
    })
    return review
  },

  findByProductId: async (productId: string): Promise<IReview[]> => {
    const reviews = await prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' }
    })
    return reviews
  },

  findByUserId: async (userId: string): Promise<IReview[]> => {
    const reviews = await prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
    return reviews
  },

  create: async (reviewData: Omit<IReview, 'id' | 'createdAt' | 'updatedAt'>): Promise<IReview> => {
    const review = await prisma.review.create({
      data: reviewData
    })
    return review
  },

  update: async (id: string, reviewData: Partial<IReview>): Promise<IReview> => {
    const review = await prisma.review.update({
      where: { id },
      data: reviewData
    })
    return review
  },

  delete: async (id: string): Promise<void> => {
    await prisma.review.delete({
      where: { id }
    })
  }
}
