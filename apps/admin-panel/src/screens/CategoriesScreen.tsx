import {
  useCategoryTree,
  useProductCounts,
  useSaveCategory,
  useRemoveCategory,
} from '@app/infrastructure';
import { Button, useToast } from '@app/ui-kit';
import { Folder, FolderOpen, Pencil, Plus, Trash2 } from '@tamagui/lucide-icons';
import React, { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { YStack, XStack, Text, Spinner, Card, H3, Separator } from 'tamagui';

import { CategoryFormModal, type CategoryNode, type CategoryFormValues } from '../components/CategoryFormModal';

interface TreeNode extends CategoryNode {
  children: TreeNode[];
  productCount: number;
}

function buildTree(categories: CategoryNode[], counts: Record<string, number>): TreeNode[] {
  const byId = new Map<string, TreeNode>();
  for (const c of categories) {
    byId.set(c._id, { ...c, children: [], productCount: counts[c.name] ?? 0 });
  }
  const roots: TreeNode[] = [];
  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)?.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    for (const n of nodes) n.children = sortNodes(n.children);
    return nodes;
  };
  return sortNodes(roots);
}

function CategoryRow({
  node,
  depth,
  onEdit,
  onDelete,
}: {
  node: TreeNode;
  depth: number;
  onEdit: (node: CategoryNode) => void;
  onDelete: (node: TreeNode) => void;
}) {
  const [expanded, setExpanded] = useState(depth === 0);
  const Icon = expanded && node.children.length > 0 ? FolderOpen : Folder;
  return (
    <YStack>
      <XStack
        alignItems="center"
        gap="$2"
        padding="$2"
        paddingLeft={8 + depth * 20}
        backgroundColor="$surface"
        borderRadius="$3"
        borderWidth={1}
        borderColor="$borderColor"
        onPress={() => setExpanded((v) => !v)}
        cursor="pointer"
      >
        <Icon size={18} color="$textSecondary" />
        <YStack flex={1}>
          <Text fontSize="$4" fontWeight="600">
            {node.name}
          </Text>
          <Text fontSize="$2" color="$textSecondary">
            /{node.slug} · {node.productCount} product{node.productCount === 1 ? '' : 's'}
            {node.children.length > 0 ? ` · ${node.children.length} sub` : ''}
          </Text>
        </YStack>
        <Button size="small" variant="ghost" icon={Pencil} onPress={() => onEdit(node)}>
          Edit
        </Button>
        <Button size="small" variant="ghost" icon={Trash2} onPress={() => onDelete(node)}>
          Delete
        </Button>
      </XStack>
      {expanded &&
        node.children.map((child) => (
          <CategoryRow key={child._id} node={child} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} />
        ))}
    </YStack>
  );
}

export function CategoriesScreen() {
  const tree = useCategoryTree();
  const counts = useProductCounts();
  const saveCategory = useSaveCategory();
  const removeCategory = useRemoveCategory();
  const { showToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryNode | null>(null);

  const roots = useMemo(() => {
    if (!tree) return null;
    const nodes = (tree ?? []) as unknown as CategoryNode[];
    return buildTree(nodes, counts ?? {});
  }, [tree, counts]);

  const flatList = useMemo(() => {
    if (!tree) return [];
    return (tree ?? []) as unknown as CategoryNode[];
  }, [tree]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (node: CategoryNode) => {
    setEditing(node);
    setModalOpen(true);
  };

  const handleSubmit = async (values: CategoryFormValues) => {
    const parent = values.parentId ? flatList.find((c) => c._id === values.parentId) : undefined;
    await saveCategory({
      id: editing?._id,
      name: values.name,
      slug: values.slug,
      description: values.description,
      parentId: values.parentId,
      level: parent ? parent.level + 1 : 0,
      image: values.image,
    });
    showToast({
      variant: 'success',
      title: editing ? 'Category updated' : 'Category created',
      message: values.name,
    });
  };

  const handleDelete = (node: TreeNode) => {
    const warning =
      node.productCount > 0
        ? `"${node.name}" has ${node.productCount} products assigned. They will keep the category name but it will no longer be manageable. Delete anyway?`
        : node.children.length > 0
          ? `"${node.name}" has ${node.children.length} subcategories, which will become root categories. Delete anyway?`
          : `Delete "${node.name}"?`;
    Alert.alert('Delete category', warning, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            // Reparent children to root first so nothing is orphaned
            for (const child of node.children) {
              await saveCategory({
                id: child._id,
                name: child.name,
                slug: child.slug,
                description: child.description,
                parentId: undefined,
                level: 0,
                image: child.image,
              });
            }
            await removeCategory(node._id);
            showToast({ variant: 'success', title: 'Category deleted', message: node.name });
          } catch (e) {
            showToast({
              variant: 'error',
              title: 'Delete failed',
              message: e instanceof Error ? e.message : 'Unknown error',
            });
          }
        },
      },
    ]);
  };

  if (!roots) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$8">
        <Spinner size="large" color="$primary" />
      </YStack>
    );
  }

  return (
    <YStack gap="$4" flex={1} padding="$4">
      <XStack justifyContent="space-between" alignItems="center">
        <H3>Categories</H3>
        <Button size="small" variant="primary" icon={Plus} onPress={openCreate}>
          Create Category
        </Button>
      </XStack>
      <Separator borderColor="$borderColor" />
      {roots.length === 0 ? (
        <Card padding="$4">
          <Text color="$textSecondary">No categories yet. Create the first root category.</Text>
        </Card>
      ) : (
        <YStack gap="$2">
          {roots.map((node) => (
            <CategoryRow key={node._id} node={node} depth={0} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </YStack>
      )}
      <CategoryFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initial={editing}
        categories={flatList}
        onSubmit={handleSubmit}
      />
    </YStack>
  );
}
