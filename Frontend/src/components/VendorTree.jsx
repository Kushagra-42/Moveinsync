import React, { useState, useEffect, useCallback, memo } from 'react';
import { fetchSubtree } from '../api/vendors';
import useAuthStore from '../store/authStore';
import '../styles/tree.css';

// Individual node component to avoid recursive rendering issues
const TreeNode = memo(({ 
  node,
  expandedIds,
  selectedId,
  onToggle,
  onSelect,
  onEdit
}) => {
  if (!node) return null;
  
  // Skip rendering stats objects
  if (typeof node === 'object' && (node.hasOwnProperty('total') || node.hasOwnProperty('byVendorLevel'))) {
    return null;
  }

  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds.has(node._id);
  const isSelected = selectedId === node._id;

  // Helper functions for icons and information
  const getLevelIcon = () => {
    switch(node.level) {
      case 'SuperVendor': return '🏢'; // Building for headquarters
      case 'RegionalVendor': return '🌐'; // Globe for regional
      case 'CityVendor': return '🏙️'; // City for city vendor
      case 'Driver': return '🚗'; // Car for driver
      default: return '📍'; // Default icon
    }
  };

  const getInitials = (name) => {
    if (!name) return '';
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  const getNodeClass = () => {
    switch(node.level) {
      case 'SuperVendor': return 'super-vendor';
      case 'RegionalVendor': return 'regional-vendor';
      case 'CityVendor': return 'city-vendor';
      case 'Driver': return 'driver';
      default: return '';
    }
  };

  const getLocationInfo = () => {
    let location = '';
    if (node.region) location += node.region;
    if (node.city) {
      if (location) location += ', ';
      location += node.city;
    }
    return location ? `(${location})` : '';
  };

  return (
    <li>
      <div 
        className={`node ${getNodeClass()} ${isSelected ? 'selected' : ''}`} 
        onClick={() => onSelect(node)}
      >
        <div className={`node-avatar ${getNodeClass()}`}>
          {getInitials(node.name)}
        </div>
        
        <div className="node-content">
          <div className="node-name">
            {getLevelIcon()} {node.name}
          </div>
          <div className="node-email">{node.email}</div>
          {getLocationInfo() && <div className="node-meta">{getLocationInfo()}</div>}
        </div>
        
        {hasChildren && (
          <div 
            className="collapse-indicator"
            onClick={(e) => { 
              e.stopPropagation(); 
              onToggle(node._id); 
            }}
          >
            {isExpanded ? '▼' : '▶'}
          </div>
        )}
        
        {onEdit && (
          <button 
            className="edit-button"
            onClick={(e) => { 
              e.stopPropagation(); 
              onEdit(node); 
            }}
          >
            ✏️
          </button>
        )}
      </div>
      
      {hasChildren && isExpanded && (
        <ul>
          {node.children.map(child => (
            <TreeNode
              key={child._id}
              node={child}
              expandedIds={expandedIds}
              selectedId={selectedId}
              onToggle={onToggle}
              onSelect={onSelect}
              onEdit={onEdit}
            />
          ))}
        </ul>
      )}
    </li>
  );
});

const VendorTree = ({ onSelect, initialVendorId = null, showEditButton = false }) => {
  const user = useAuthStore(state => state.user);
  const [treeData, setTreeData] = useState([]);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load tree data
  const loadTree = useCallback(async () => {
    if (!user || !user.vendorId) return;
    
    try {
      setLoading(true);
      setError(null);

      const vendorId = initialVendorId || user.vendorId;
      const response = await fetchSubtree(vendorId);
      
      if (!response.tree || !Array.isArray(response.tree)) {
        throw new Error('Invalid tree data received');
      }

      setTreeData(response.tree);
      
      // Auto-expand the root and first level nodes
      const newExpandedIds = new Set([vendorId]);
      
      // Find root node and expand its children
      const rootNode = response.tree.find(node => node._id === vendorId);
      if (rootNode && rootNode.children) {
        rootNode.children.forEach(child => newExpandedIds.add(child._id));
      }
      
      setExpandedIds(newExpandedIds);
      
    } catch (err) {
      console.error("Error loading vendor tree:", err);
      setError(err.message || "Failed to load vendor hierarchy. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user, initialVendorId]);
  
  // Load tree on mount and when dependencies change
  useEffect(() => {
    if (user && user.vendorId) {
      loadTree();
    }
  }, [user, refreshKey, loadTree]);
  
  // Build nested structure
  const buildNestedTree = useCallback(() => {
    if (!treeData.length || !user) return [];
    
    // Create a map of all vendors
    const map = {};
    treeData.forEach(v => { 
      map[v._id] = { ...v, children: [] }; 
    });
    
    // Find the root vendor as per initialVendorId or user.vendorId
    const rootVendorId = initialVendorId || user.vendorId;
    let root = map[rootVendorId];
    
    if (!root) {
      return [];
    }
    
    // Build the tree by adding children to their parents
    treeData.forEach(v => {
      if (v.parentVendorId && map[v.parentVendorId]) {
        const parent = map[v.parentVendorId];
        parent.children.push(map[v._id]);
      }
    });
    
    // Sort children by level and then name
    Object.values(map).forEach(node => {
      if (node.children.length > 0) {
        node.children.sort((a, b) => {
          // First sort by level importance
          const levelOrder = { 'SuperVendor': 1, 'RegionalVendor': 2, 'CityVendor': 3, 'Driver': 4 };
          const levelDiff = (levelOrder[a.level] || 99) - (levelOrder[b.level] || 99);
          
          if (levelDiff !== 0) return levelDiff;
          
          // Then by name alphabetically
          return a.name.localeCompare(b.name);
        });
      }
    });
    
    return [root];
  }, [treeData, user, initialVendorId]);
  
  // Toggle node expansion
  const handleToggle = useCallback((id) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Handle node selection
  const handleSelect = useCallback((node) => {
    setSelectedId(node._id);
    if (onSelect) {
      onSelect(node);
    }
  }, [onSelect]);

  // Handle node editing (if enabled)
  const handleEdit = useCallback((node) => {
    if (onSelect) {
      onSelect(node);
    }
  }, [onSelect]);

  // Determine view to show
  const nestedTree = buildNestedTree();

  if (loading) {
    return <div className="loading-tree">Loading vendor hierarchy...</div>;
  }

  if (error) {
    return (
      <div className="tree-error">
        <p>{error}</p>
        <button onClick={() => setRefreshKey(k => k + 1)} className="refresh-button">Try Again</button>
      </div>
    );
  }

  return (
    <div className="vendor-tree-container">
      <div className="tree-header">
        <h3>Vendor Hierarchy</h3>
        <button onClick={() => setRefreshKey(k => k + 1)} className="refresh-button">
          <span>↻</span> Refresh
        </button>
      </div>
      
      <div className="tree-content">
        <div className="org-tree">        {nestedTree.length > 0 ? (
            <ul>
              {nestedTree.map(node => {
                // Skip rendering stats objects
                if (node && typeof node === 'object' && 
                    (node.hasOwnProperty('total') || 
                    node.hasOwnProperty('byVendorLevel'))) {
                  return null;
                }
                
                return (
                  <TreeNode
                    key={node._id}
                    node={node}
                    expandedIds={expandedIds}
                    selectedId={selectedId}
                    onToggle={handleToggle}
                    onSelect={handleSelect}
                    onEdit={showEditButton ? handleEdit : null}
                  />
                );
              })}
            </ul>
          ) : (
            <p className="no-data">No vendor hierarchy data available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorTree;
