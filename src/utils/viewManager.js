// View Management System for GM/Player content filtering

export const VIEW_TYPES = {
  PLAYER: 'player',
  GM: 'gm'
};

// Get current view from URL parameters (client-side only)
export function getCurrentView() {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    return view === VIEW_TYPES.GM ? VIEW_TYPES.GM : VIEW_TYPES.PLAYER;
  }
  return VIEW_TYPES.PLAYER; // Default to player view for SSR
}

// Filter posts based on view permissions
export function filterPostsByView(posts, view = VIEW_TYPES.PLAYER) {
  return posts.filter(post => {
    const data = post.data;
    
    // Always show content marked as player-safe
    if (data.playerVisible === true) return true;
    
    // GM can see everything
    if (view === VIEW_TYPES.GM) return true;
    
    // Player view restrictions
    if (view === VIEW_TYPES.PLAYER) {
      // Hide GM-only content
      if (data.gmOnly === true) return false;
      
      // Hide spoiler content
      if (data.tags && data.tags.includes('spoiler')) return false;
      
      // Hide unpublished content
      if (data.playerVisible === false) return false;
      
      // Default: show if not explicitly restricted
      return data.playerVisible !== false;
    }
    
    return true;
  });
}

// Generate view toggle URL
export function getViewToggleUrl(currentView, targetView) {
  if (typeof window !== 'undefined') {
    const url = new URL(window.location);
    if (targetView === VIEW_TYPES.PLAYER) {
      url.searchParams.delete('view');
    } else {
      url.searchParams.set('view', targetView);
    }
    return url.toString();
  }
  return '';
}

// Check if content should be visible to players
export function isPlayerVisible(post) {
  const data = post.data;
  
  // Explicitly marked as player visible
  if (data.playerVisible === true) return true;
  
  // Explicitly marked as GM only
  if (data.gmOnly === true || data.playerVisible === false) return false;
  
  // Contains spoiler tags
  if (data.tags && data.tags.includes('spoiler')) return false;
  
  // Default to visible unless restricted
  return true;
}
