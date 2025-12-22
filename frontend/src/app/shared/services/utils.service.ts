/**
 * Utility Service
 * TEC Voting System - Frontend
 * 
 * Shared utility functions used across components
 */

import { Injectable, inject } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  /**
   * Get the full URL for a candidate photo
   * Note: Requires environment.staticUrl to be passed in
   */
  getPhotoUrl(photo: string | null | undefined, staticUrl: string): string {
    if (!photo) return '';
    return `${staticUrl}/${photo}`;
  }
  
  /**
   * Get initials from a name (e.g., "John Doe" -> "JD")
   */
  getInitials(name: string): string {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
  
  /**
   * Extract error message from API error response
   */
  extractErrorMessage(error: any, fallback = 'An error occurred'): string {
    return error?.error?.error 
      || error?.error?.message 
      || error?.message 
      || fallback;
  }
  
  /**
   * Format date for display
   */
  formatDate(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  
  /**
   * Format percentage with 1 decimal place
   */
  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }
}
