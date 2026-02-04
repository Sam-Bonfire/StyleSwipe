export interface TaggerResult {
  category: string;
  vibes: string[];
  attributes: {
    color?: string;
    material?: string;
    occasion?: string;
    fit?: string;
  };
}

export class TaggingService {
  private static readonly CATEGORY_MAP: Record<string, string> = {
    't-shirt': 'Top',
    shirt: 'Top',
    jeans: 'Bottom',
    trousers: 'Bottom',
    joggers: 'Bottom',
    sneakers: 'Shoes',
    shoes: 'Shoes',
    boots: 'Shoes',
    dress: 'Top', // Simplified for now
    jacket: 'Outerwear',
    sweatshirt: 'Outerwear',
  };

  private static readonly VIBES_KEYWORDS: Record<string, string[]> = {
    party: ['party', 'club', 'night', 'shiny', 'sequin'],
    casual: ['casual', 'relaxed', 'everyday', 'basic', 'daily'],
    formal: ['formal', 'office', 'work', 'corporate', 'suit', 'blazer'],
    sport: ['sport', 'gym', 'run', 'active', 'training', 'perform'],
    vacation: ['resort', 'beach', 'summer', 'holiday'],
  };

  private static readonly COLORS = [
    'red',
    'blue',
    'green',
    'black',
    'white',
    'grey',
    'yellow',
    'pink',
    'purple',
    'navy',
    'beige',
    'brown',
  ];
  private static readonly MATERIALS = [
    'cotton',
    'polyester',
    'silk',
    'linen',
    'wool',
    'leather',
    'denim',
    'suede',
  ];
  private static readonly OCCASIONS = ['casual', 'party', 'formal', 'sport'];

  public generateTags(text: string, rawCategory?: string): TaggerResult {
    const normalizedText = text.toLowerCase();

    // 1. Determine Category
    let category = 'Uncategorized';
    if (rawCategory) {
      const lowerRaw = rawCategory.toLowerCase();
      for (const [key, val] of Object.entries(TaggingService.CATEGORY_MAP)) {
        if (lowerRaw.includes(key)) {
          category = val;
          break;
        }
      }
    }

    // Fallback: search text for category keywords if not found
    if (category === 'Uncategorized') {
      for (const [key, val] of Object.entries(TaggingService.CATEGORY_MAP)) {
        if (normalizedText.includes(key)) {
          category = val;
          break;
        }
      }
    }

    // 2. Extract Vibes
    const vibes = new Set<string>();
    for (const [vibe, keywords] of Object.entries(TaggingService.VIBES_KEYWORDS)) {
      if (keywords.some((k) => normalizedText.includes(k))) {
        vibes.add(vibe);
      }
    }

    // 3. Extract Attributes
    const attributes: TaggerResult['attributes'] = {};

    // Color
    for (const color of TaggingService.COLORS) {
      if (normalizedText.includes(color)) {
        attributes.color = color;
        break; // Assume primary color
      }
    }

    // Material
    for (const mat of TaggingService.MATERIALS) {
      if (normalizedText.includes(mat)) {
        attributes.material = mat;
        break;
      }
    }

    // Occasion (reuse vibes usually, but specific mapping if needed)
    for (const occ of TaggingService.OCCASIONS) {
      if (normalizedText.includes(occ)) {
        attributes.occasion = occ;
        break;
      }
    }

    return {
      category,
      vibes: Array.from(vibes),
      attributes,
    };
  }
}
