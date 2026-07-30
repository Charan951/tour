/**
 * Theme Matching Utility to retrieve all packages related to a selected theme
 */

export const isPackageMatchingTheme = (pkg: any, targetTheme: string): boolean => {
  if (!targetTheme || targetTheme === 'All' || targetTheme === 'All Themes') return true;

  const normalize = (str: string) => str.toLowerCase().trim();
  const themeNorm = normalize(targetTheme);

  // 1. Direct match on themeName property
  if (pkg.themeName && normalize(pkg.themeName) === themeNorm) return true;

  // 2. Direct match on populated theme object or array
  if (pkg.theme) {
    if (Array.isArray(pkg.theme)) {
      if (pkg.theme.some((t: any) => t.name && normalize(t.name) === themeNorm)) return true;
    } else if (typeof pkg.theme === 'object' && pkg.theme.name) {
      if (normalize(pkg.theme.name) === themeNorm) return true;
    }
  }

  // 3. Keyword-based fallback matching on title, overview, highlights, and activities
  const keywordsMap: Record<string, string[]> = {
    'honeymoon tour': ['honeymoon', 'couple', 'romantic', 'candlelight', 'flower bed', 'pool villa', 'romantic getaway'],
    'leisure': ['leisure', 'relax', 'beach', 'resort', 'spa', 'slow-paced', 'vacation'],
    'hill station': ['hill', 'station', 'mountain', 'snow', 'peaks', 'shimla', 'manali', 'munnar', 'ooty', 'kodaikanal', 'tea garden'],
    'trekking': ['trekking', 'trek', 'hiking', 'trails', 'camping', 'summit', 'climb'],
    'adventure': ['adventure', 'water sports', 'rafting', 'scuba', 'zip-line', 'safari', 'parasailing', 'jet ski', 'atv'],
    'religious': ['religious', 'pilgrimage', 'temple', 'darshan', 'spiritual', 'shrine', 'devotional'],
    'family tour': ['family', 'kids', 'theme park', 'resort', 'sightseeing'],
    'wildlife safari': ['wildlife', 'safari', 'jungle', 'national park', 'tiger', 'reserve', 'forest']
  };

  const keywords = keywordsMap[themeNorm] || [themeNorm.replace(' tour', '').replace(' safari', '')];
  const combinedText = normalize(`${pkg.title || ''} ${pkg.overview || ''} ${(pkg.highlights || []).join(' ')} ${(pkg.activities || []).join(' ')}`);

  return keywords.some((kw) => combinedText.includes(kw));
};
