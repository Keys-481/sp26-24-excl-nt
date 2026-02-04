import { forwardRef, useImperativeHandle, useState } from 'react';
import { useApiClient } from '../lib/apiClient';

/**
 * SearchBar component for searching with two parameters.
 *
 * @param {*} param0 - Props containing onSearch callback and searchEndpoint URL.
 * @returns {JSX.Element} The rendered SearchBar component.
 */
const SearchBar = forwardRef(function SearchBar({ onSearch, searchEndpoint, placeholder1 = 'School ID', placeholder2 = 'Student Name' }, ref) {
  const api = useApiClient();

  const [query1, setQuery1] = useState('');
  const [query2, setQuery2] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchEndpoint) {
      console.error('Search endpoint is not defined.');
      return;
    }
    setLoading(true);
    try {
      // Try modern parameter names, backend supports legacy q1/q2 for compatibility
      const params = new URLSearchParams();
      if (query1) params.set('q1', query1);
      if (query2) params.set('q2', query2);

      const url = `${searchEndpoint}?${params.toString()}`;
      const data = await api.get(url);

      // Normalize response to an array for caller
      const list = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
      onSearch?.(list, { q1: query1, q2: query2 });
    } catch (error) {
      console.error('[SearchBar] Search failed:', error?.message || error);
      onSearch?.([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  // Expose handleSearch to parent via ref
  useImperativeHandle(ref, () => ({
    triggerSearch: handleSearch
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '18vw' }}>
      <input
        type="text"
        className="search-textbox"
        placeholder={placeholder1}
        value={query1}
        onChange={(e) => setQuery1(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <input
        type="text"
        className="search-textbox"
        placeholder={placeholder2}
        value={query2}
        onChange={(e) => setQuery2(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
});

export default SearchBar;
