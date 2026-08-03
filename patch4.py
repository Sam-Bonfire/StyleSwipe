with open("packages/convex/convex/betterAuth/adapterUtils.ts", "r") as f:
    content = f.read()

# Add `connector` and `mode` to adapterWhereValidator to support newer Better Auth requirements
new_validator = """export const adapterWhereValidator = v.object({
  connector: v.optional(v.union(v.literal('AND'), v.literal('OR'))),
  field: v.string(),
  mode: v.optional(v.union(v.literal('sensitive'), v.literal('insensitive'))),
  operator: v.optional(
"""
content = content.replace("export const adapterWhereValidator = v.object({\n  field: v.string(),\n  operator: v.optional(", new_validator)

with open("packages/convex/convex/betterAuth/adapterUtils.ts", "w") as f:
    f.write(content)
