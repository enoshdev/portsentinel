import React, { useState, useMemo } from 'react';
import { StatusChip } from './StatusChip';

/**
 * LogTable Component
 * Strictly adheres to design.md Section 2 table rules:
 * Pure white canvas-elevated background, 1px hairline frame, #fafafa header with 12px mono,
 * tabular data cells, restrained status colors, practical search and filtering.
 */
export const LogTable = ({
  logs = [],
  filteredIp = null,
  onSelectRow,
  selectedLogId = null,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortField, setSortField] = useState('time');
  const [sortAsc, setSortAsc] = useState(false);

  // Filter & Sort
  const processedLogs = useMemo(() => {
    let result = [...logs];

    // Filter by specific IP if requested
    if (filteredIp) {
      result = result.filter((item) => item.srcIp === filteredIp);
    }

    // Filter by search string
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.srcIp.toLowerCase().includes(q) ||
          String(item.dstPort).includes(q) ||
          (item.proto && item.proto.toLowerCase().includes(q)) ||
          (item.verdict && item.verdict.toLowerCase().includes(q)) ||
          (item.status && item.status.toLowerCase().includes(q))
      );
    }

    // Filter by status tab
    if (statusFilter !== 'ALL') {
      result = result.filter((item) => {
        if (statusFilter === 'BLOCKED') return item.status === 'Blocked';
        if (statusFilter === 'CONFIRMED') return item.status === 'Confirmed Scan';
        if (statusFilter === 'SUSPICIOUS') return item.status === 'Suspicious';
        if (statusFilter === 'NORMAL') return item.status === 'Normal';
        return true;
      });
    }

    // Sort
    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') {
        const cmp = valA.localeCompare(valB);
        return sortAsc ? cmp : -cmp;
      }
      return sortAsc ? valA - valB : valB - valA;
    });

    return result;
  }, [logs, filteredIp, searchTerm, statusFilter, sortField, sortAsc]);

  const handleHeaderSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div
      className={className}
      style={{
        backgroundColor: 'var(--canvas-elevated)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--rounded-md)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-whisper)'
      }}
    >
      {/* Table Toolbar */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--hairline)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          backgroundColor: 'var(--canvas-elevated)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--ink)' }}>
            terminal
          </span>
          <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ink)' }}>
            Connection Event Logs
          </span>
          {filteredIp && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--body)',
                backgroundColor: 'var(--hairline-soft)',
                padding: '2px 6px',
                borderRadius: 'var(--rounded-sm)'
              }}
            >
              Filtered: {filteredIp}
            </span>
          )}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--mute)' }}>
            ({processedLogs.length} events)
          </span>
        </div>

        {/* Search & Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '15px',
                color: 'var(--mute)'
              }}
            >
              search
            </span>
            <input
              type="text"
              placeholder="Search IP, port, payload..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '5px 8px 5px 28px',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--rounded-sm)',
                backgroundColor: 'var(--canvas)',
                width: '190px'
              }}
            />
          </div>

          {/* Status Filter Buttons */}
          <div style={{ display: 'flex', gap: '2px', backgroundColor: 'var(--canvas)', padding: '2px', borderRadius: 'var(--rounded-sm)', border: '1px solid var(--hairline)' }}>
            {['ALL', 'CONFIRMED', 'SUSPICIOUS', 'NORMAL'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                style={{
                  padding: '3px 7px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: statusFilter === tab ? 600 : 400,
                  borderRadius: '3px',
                  backgroundColor: statusFilter === tab ? 'var(--canvas-elevated)' : 'transparent',
                  color: statusFilter === tab ? 'var(--ink)' : 'var(--mute)',
                  border: statusFilter === tab ? '1px solid var(--hairline)' : '1px solid transparent'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr
              style={{
                backgroundColor: 'var(--canvas)',
                borderBottom: '1px solid var(--hairline)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 500,
                color: 'var(--mute)',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
                userSelect: 'none'
              }}
            >
              <th
                onClick={() => handleHeaderSort('time')}
                style={{ padding: '8px 12px', cursor: 'pointer', width: '100px' }}
              >
                Timestamp {sortField === 'time' && (sortAsc ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleHeaderSort('srcIp')}
                style={{ padding: '8px 12px', cursor: 'pointer', width: '140px' }}
              >
                Source IP {sortField === 'srcIp' && (sortAsc ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleHeaderSort('dstPort')}
                style={{ padding: '8px 12px', cursor: 'pointer', width: '100px' }}
              >
                Dest Port {sortField === 'dstPort' && (sortAsc ? '↑' : '↓')}
              </th>
              <th style={{ padding: '8px 12px', width: '90px' }}>Proto / Flags</th>
              <th style={{ padding: '8px 12px' }}>Event Verdict & Description</th>
              <th
                onClick={() => handleHeaderSort('status')}
                style={{ padding: '8px 12px', cursor: 'pointer', width: '140px' }}
              >
                Classification {sortField === 'status' && (sortAsc ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
            {processedLogs.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  style={{
                    padding: '36px',
                    textAlign: 'center',
                    color: 'var(--mute)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '13px'
                  }}
                >
                  No packet telemetry events match current filter parameters.
                </td>
              </tr>
            ) : (
              processedLogs.map((log) => {
                const isSelected = selectedLogId === log.id;
                return (
                  <tr
                    key={log.id}
                    onClick={() => onSelectRow && onSelectRow(log)}
                    style={{
                      borderBottom: '1px solid var(--hairline)',
                      backgroundColor: isSelected ? 'var(--hairline-soft)' : 'transparent',
                      cursor: onSelectRow ? 'pointer' : 'default',
                      transition: 'background-color 0.1s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--hairline-soft)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td style={{ padding: '8px 12px', color: 'var(--mute)', whiteSpace: 'nowrap' }}>
                      {log.time}
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--ink)', fontWeight: 500 }}>
                      {log.srcIp}
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--ink)' }}>
                      <span
                        style={{
                          backgroundColor: 'var(--hairline-soft)',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          border: '1px solid var(--hairline)',
                          fontWeight: 500
                        }}
                      >
                        :{log.dstPort}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--body)' }}>
                      {log.proto || 'TCP SYN'}
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--body)', fontFamily: 'var(--font-sans)', fontSize: '13px' }}>
                      {log.verdict}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <StatusChip status={log.status} size="sm" />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
