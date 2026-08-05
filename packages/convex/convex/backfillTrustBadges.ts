import { internalMutation } from './_generated/server';

export default internalMutation({
  args: {},
  handler: async (ctx) => {
    // 1. Fetch all products
    const products = await ctx.db.query('products').collect();
    let updatedCount = 0;

    for (const p of products) {
      const badges: string[] = [];
      const desc = p.description?.toLowerCase() || '';
      const attrs = JSON.stringify(p.attributes || {}).toLowerCase();
      const meta = JSON.stringify(p.meta || {}).toLowerCase();
      
      const fullText = `${desc} ${attrs} ${meta}`;

      // Always add authentic
      badges.push('authentic');

      // Check for sustainability
      if (
        fullText.includes('sustainable') ||
        fullText.includes('recycled') ||
        fullText.includes('organic cotton') ||
        fullText.includes('eco-friendly')
      ) {
        badges.push('sustainable');
      }

      // Check for vegan
      if (
        fullText.includes('vegan') ||
        fullText.includes('faux leather') ||
        fullText.includes('cruelty-free')
      ) {
        badges.push('vegan');
      }

      // Check for locally sourced
      if (
        fullText.includes('locally sourced') ||
        fullText.includes('made in usa') ||
        fullText.includes('made locally')
      ) {
        badges.push('locally_sourced');
      }

      // Check for top seller (performance)
      if (p.reviewCount && p.reviewCount > 500 && p.rating && p.rating > 4.5) {
        badges.push('top_seller');
      }

      // Platform specific checks (example logic)
      if (p.platform === 'Myntra' || fullText.includes('free delivery')) {
        // Just an example, maybe Myntra has a universal free delivery threshold
        // Or if attributes say free delivery
        if (fullText.includes('free delivery')) {
          badges.push('free_delivery');
        }
      }

      if (fullText.includes('returnable') || fullText.includes('easy returns') || fullText.includes('14 day returns')) {
        badges.push('easy_returns');
      }

      // De-duplicate just in case
      const uniqueBadges = Array.from(new Set(badges));

      await ctx.db.patch(p._id, {
        trustBadges: uniqueBadges,
      });
      updatedCount++;
    }

    return { success: true, updatedCount };
  },
});
