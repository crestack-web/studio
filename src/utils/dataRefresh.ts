/**
 * Utility to handle data refresh events across the app
 */

export interface DataRefreshEventDetail {
  timestamp: number;
  actionType?: string;
  data?: any;
}

export class DataRefreshManager {
  private static instance: DataRefreshManager;
  private eventTarget: EventTarget;

  private constructor() {
    this.eventTarget = new EventTarget();
  }

  public static getInstance(): DataRefreshManager {
    if (!DataRefreshManager.instance) {
      DataRefreshManager.instance = new DataRefreshManager();
    }
    return DataRefreshManager.instance;
  }

  /**
   * Subscribe to data refresh events
   */
  public subscribe(eventType: string, callback: (event: CustomEvent<DataRefreshEventDetail>) => void): void {
    this.eventTarget.addEventListener(eventType, callback as EventListener);
  }

  /**
   * Unsubscribe from data refresh events
   */
  public unsubscribe(eventType: string, callback: (event: CustomEvent<DataRefreshEventDetail>) => void): void {
    this.eventTarget.removeEventListener(eventType, callback as EventListener);
  }

  /**
   * Trigger a data refresh event
   */
  public dispatch(eventType: string, detail: DataRefreshEventDetail): void {
    const event = new CustomEvent<DataRefreshEventDetail>(eventType, { detail });
    this.eventTarget.dispatchEvent(event);
  }

  /**
   * Trigger a general data refresh event
   */
  public triggerDataRefresh(detail?: Partial<DataRefreshEventDetail>): void {
    this.dispatch('dataRefresh', {
      timestamp: Date.now(),
      ...detail
    });
  }

  /**
   * Trigger a specific action refresh event
   */
  public triggerActionRefresh(actionType: string, data?: any): void {
    this.dispatch('actionExecuted', {
      timestamp: Date.now(),
      actionType,
      data
    });
  }
}

// Export singleton instance
export const dataRefreshManager = DataRefreshManager.getInstance();

// Convenience functions that use the singleton instance
export const subscribeToDataRefresh = (callback: (event: CustomEvent<DataRefreshEventDetail>) => void): void => {
  dataRefreshManager.subscribe('dataRefresh', callback);
};

export const subscribeToActionEvents = (callback: (event: CustomEvent<DataRefreshEventDetail>) => void): void => {
  dataRefreshManager.subscribe('actionExecuted', callback);
};

export const triggerDataRefresh = (detail?: Partial<DataRefreshEventDetail>): void => {
  dataRefreshManager.dispatch('dataRefresh', {
    timestamp: Date.now(),
    ...detail
  });
};

export const triggerActionRefresh = (actionType: string, data?: any): void => {
  dataRefreshManager.dispatch('actionExecuted', {
    timestamp: Date.now(),
    actionType,
    data
  });
};