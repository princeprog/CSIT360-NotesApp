import { useState, useEffect, useRef, useCallback } from 'react';
import { useNotes } from '../context/NotesContext';


export const useStatusPolling = (interval = 10000) => {
  const [isPolling, setIsPolling] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  
  const { refreshNotes, notes } = useNotes();
  const pollingInterval = useRef(null);
  const notificationTimeout = useRef([]);
  const previousPendingIds = useRef(new Set());
  const isCheckingRef = useRef(false);
  const stopPollingRef = useRef(null);
  
  // Use ref to always have latest refreshNotes without breaking useCallback dependencies
  const refreshNotesRef = useRef(refreshNotes);
  useEffect(() => {
    refreshNotesRef.current = refreshNotes;
  }, [refreshNotes]);


  const addNotification = useCallback((notification) => {
    setNotifications(prev => {
      // Avoid duplicate notifications
      if (prev.some(n => n.id === notification.id)) {
        return prev;
      }
      return [...prev, { ...notification, timestamp: new Date() }];
    });

    // Auto-remove notification after 5 seconds
    const timeoutId = setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
    
    notificationTimeout.current.push(timeoutId);
  }, []);

  /**
   * Dismiss notification manually
   */
  const dismissNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  /**
   * Clear all notifications
   */
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    // Clear all notification timeouts
    notificationTimeout.current.forEach(id => clearTimeout(id));
    notificationTimeout.current = [];
  }, []);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollingInterval.current) {
      console.log('⏸️ Stopping transaction status polling - no more pending transactions');
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
      setIsPolling(false);
      setPendingCount(0);
    }
  }, []);
  
  // Keep stopPollingRef updated
  useEffect(() => {
    stopPollingRef.current = stopPolling;
  }, [stopPolling]);

  /**
   * Check status of pending transactions
   */
  const checkPendingTransactions = useCallback(async () => {
    // Prevent concurrent checks
    if (isCheckingRef.current) {
      console.log('⏭️ Skipping check - already in progress');
      return;
    }
    
    isCheckingRef.current = true;
    
    try {
      console.log('🔄 Polling: Checking pending transactions...', new Date().toLocaleTimeString());
      console.log('⏰ Polling interval: Every 10 seconds');
      
      // Get fresh data from backend - use ref to get latest function
      const freshNotes = await refreshNotesRef.current();
      console.log('📊 Polling: Fresh notes fetched:', freshNotes?.length || 0);
      
      if (!freshNotes || freshNotes.length === 0) {
        setPendingCount(0);
        if (previousPendingIds.current.size > 0) {
          previousPendingIds.current.clear();
        }
        stopPollingRef.current?.();
        return;
      }
      
      // Filter pending notes directly from fresh data (no extra API call)
      const currentPendingNotes = freshNotes.filter(note => 
        note.status === 'PENDING' && note.txHash
      );
      
      console.log('📌 Polling: Current pending notes:', currentPendingNotes.length);
      
      const currentPendingIds = new Set(currentPendingNotes.map(n => n.id));
      setPendingCount(currentPendingNotes.length);
      setLastChecked(new Date());
      
      // Detect newly confirmed notes (were pending, now not in pending list)
      const newlyConfirmedIds = [...previousPendingIds.current].filter(
        id => !currentPendingIds.has(id)
      );
      
      console.log('🔍 Polling: Previously pending IDs:', [...previousPendingIds.current]);
      console.log('🔍 Polling: Currently pending IDs:', [...currentPendingIds]);
      console.log('✅ Polling: Newly confirmed IDs:', newlyConfirmedIds);
      
      // Show notifications for newly confirmed notes
      if (newlyConfirmedIds.length > 0) {
        newlyConfirmedIds.forEach(id => {
          const confirmedNote = freshNotes.find(n => n.id === id && n.status === 'CONFIRMED');
          if (confirmedNote) {
            console.log(`✅ Note "${confirmedNote.title}" confirmed!`);
            addNotification({
              id: confirmedNote.id,
              title: confirmedNote.title,
              type: 'success',
              message: `Note "${confirmedNote.title}" confirmed on blockchain!`,
              txHash: confirmedNote.txHash
            });
          }
        });
      }
      
      // Update tracking set
      previousPendingIds.current = currentPendingIds;
      
      // Stop polling if no pending transactions remain
      if (currentPendingNotes.length === 0) {
        console.log('✅ All transactions confirmed - stopping polling');
        stopPollingRef.current?.();
        return;
      }
      previousPendingIds.current = currentPendingIds;
      
    } catch (error) {
      console.error('❌ Error checking pending transactions:', error);
    } finally {
      isCheckingRef.current = false;
    }
  }, [addNotification]); // Removed stopPolling from dependencies

  /**
   * Start automatic polling
   */
  const startPolling = useCallback(() => {
    if (isPolling) {
      console.log('⚠️ Polling already active');
      return;
    }

    console.log('🔄 Starting transaction status polling...');
    setIsPolling(true);
    
    // Initial check immediately
    checkPendingTransactions();
    
    // Then check at intervals
    pollingInterval.current = setInterval(() => {
      checkPendingTransactions();
    }, interval);
  }, [isPolling, interval, checkPendingTransactions]);

  /**
   * Force immediate check (manual refresh)
   */
  const forceCheck = useCallback(async () => {
    console.log('🔍 Force checking transaction status...');
    await checkPendingTransactions();
  }, [checkPendingTransactions]);

  /**
   * Auto-start polling when there are pending notes
   */
  useEffect(() => {
    const pendingNotes = notes.filter(note => 
      note.status === 'PENDING' && note.txHash
    );

    if (pendingNotes.length > 0 && !isPolling) {
      console.log(`📌 ${pendingNotes.length} pending note(s) detected - starting polling`);
      // Initialize tracking set with current pending IDs
      previousPendingIds.current = new Set(pendingNotes.map(n => n.id));
      startPolling();
    }
  }, [notes, isPolling, startPolling]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up polling hook...');
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
      notificationTimeout.current.forEach(id => clearTimeout(id));
      notificationTimeout.current = [];
    };
  }, []); // Only run on unmount

  return {
    // State
    isPolling,
    lastChecked,
    pendingCount,
    notifications,
    
    // Controls
    startPolling,
    stopPolling,
    forceCheck,
    dismissNotification,
    clearNotifications,
  };
};

export default useStatusPolling;
