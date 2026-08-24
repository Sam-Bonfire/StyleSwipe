import { z } from 'zod';

export const StyleBoardVisibilitySchema = z.enum([
  'PRIVATE',
  'SHARED',
  'PUBLIC',
]);

export const StyleBoardRoleSchema = z.enum([
  'VIEWER',
  'EDITOR',
]);

export const StyleBoardCollaboratorSchema = z.object({
  userId: z.string(),
  role: StyleBoardRoleSchema,
});

export const StyleBoardPinnedItemSchema = z.object({
  productId: z.string(),
  addedAt: z.number(),
  addedBy: z.string(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const StyleBoardSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  title: z.string().min(1, 'Title must be at least 1 character long'),
  description: z.string().optional(),
  coverImageUrl: z.string().url('Cover image URL must be a valid URL').optional(),
  visibility: StyleBoardVisibilitySchema,
  collaborators: z.array(StyleBoardCollaboratorSchema),
  pinnedItems: z.array(StyleBoardPinnedItemSchema),
  tags: z.array(z.string()),
});

export type StyleBoardVisibility = z.infer<typeof StyleBoardVisibilitySchema>;
export type StyleBoardRole = z.infer<typeof StyleBoardRoleSchema>;
export type StyleBoardCollaborator = z.infer<typeof StyleBoardCollaboratorSchema>;
export type StyleBoardPinnedItem = z.infer<typeof StyleBoardPinnedItemSchema>;
export type StyleBoard = z.infer<typeof StyleBoardSchema>;
