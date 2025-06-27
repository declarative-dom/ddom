import { describe, test, expect, beforeEach } from 'vitest';
import DDOM from '../lib/dist/index.js';

describe('Computed Properties Example', () => {
  beforeEach(() => {
    // Clean up any global variables
    if (typeof window !== 'undefined') {
      // No specific global vars to clean for this example
    }
  });

  test('should create computed properties spec without errors', () => {
    const computedPropertiesSpec = {
      customElements: [
        {
          tagName: 'user-card',
          
          // Reactive properties
          $firstName: 'John',
          $lastName: 'Doe',
          $score: 85,
          $level: 1,

          // Computed functions instead of getters
          fullName: function() {
            return `${this.$firstName.get()} ${this.$lastName.get()}`;
          },
          
          displayTitle: function() {
            const score = this.$score.get();
            const level = this.$level.get();
            if (score >= 90) return `Expert (Level ${level})`;
            if (score >= 70) return `Advanced (Level ${level})`;
            if (score >= 50) return `Intermediate (Level ${level})`;
            return `Beginner (Level ${level})`;
          },
          
          badgeColor: function() {
            const score = this.$score.get();
            if (score >= 90) return '#28a745'; // green
            if (score >= 70) return '#007bff'; // blue  
            if (score >= 50) return '#ffc107'; // yellow
            return '#6c757d'; // gray
          }
        }
      ]
    };

    // Test that DDOM can process the computed properties spec
    expect(() => DDOM(computedPropertiesSpec)).not.toThrow();
  });

  test('should support reactive properties with scope prefix', () => {
    const spec = {
      $firstName: 'Alice',
      $lastName: 'Johnson',
      $score: 88
    };

    expect(() => DDOM(spec)).not.toThrow();
    
    // Test that the properties are available on window
    expect(window.$firstName).toBeDefined();
    expect(window.$lastName).toBeDefined();
    expect(window.$score).toBeDefined();
  });

  test('should handle score-based logic in computed properties', () => {
    // Test the logic that would be in computed properties
    const getDisplayTitle = (score, level) => {
      if (score >= 90) return `Expert (Level ${level})`;
      if (score >= 70) return `Advanced (Level ${level})`;
      if (score >= 50) return `Intermediate (Level ${level})`;
      return `Beginner (Level ${level})`;
    };

    const getBadgeColor = (score) => {
      if (score >= 90) return '#28a745'; // green
      if (score >= 70) return '#007bff'; // blue  
      if (score >= 50) return '#ffc107'; // yellow
      return '#6c757d'; // gray
    };

    const getLevelClass = (score) => {
      if (score >= 90) return 'expert';
      if (score >= 70) return 'advanced';  
      if (score >= 50) return 'intermediate';
      return 'beginner';
    };

    // Test beginner level
    expect(getDisplayTitle(30, 1)).toBe('Beginner (Level 1)');
    expect(getBadgeColor(30)).toBe('#6c757d');
    expect(getLevelClass(30)).toBe('beginner');

    // Test intermediate level
    expect(getDisplayTitle(60, 1)).toBe('Intermediate (Level 1)');
    expect(getBadgeColor(60)).toBe('#ffc107');
    expect(getLevelClass(60)).toBe('intermediate');

    // Test advanced level
    expect(getDisplayTitle(80, 1)).toBe('Advanced (Level 1)');
    expect(getBadgeColor(80)).toBe('#007bff');
    expect(getLevelClass(80)).toBe('advanced');

    // Test expert level
    expect(getDisplayTitle(95, 1)).toBe('Expert (Level 1)');
    expect(getBadgeColor(95)).toBe('#28a745');
    expect(getLevelClass(95)).toBe('expert');
  });

  test('should handle progress percentage computation logic', () => {
    const getProgressPercentage = (score) => {
      return Math.min(100, Math.max(0, score));
    };

    expect(getProgressPercentage(75)).toBe(75);
    expect(getProgressPercentage(-10)).toBe(0); // Should clamp to 0
    expect(getProgressPercentage(150)).toBe(100); // Should clamp to 100
    expect(getProgressPercentage(42)).toBe(42); // Normal value
  });

  test('should handle full name computation logic', () => {
    const getFullName = (firstName, lastName) => {
      return `${firstName} ${lastName}`;
    };

    expect(getFullName('John', 'Doe')).toBe('John Doe');
    expect(getFullName('Alice', 'Johnson')).toBe('Alice Johnson');
    expect(getFullName('Bob', 'Wilson')).toBe('Bob Wilson');
  });

  test('should support complex computed property dependencies logic', () => {
    const getAdjustedScore = (score, bonus) => {
      return score + bonus;
    };

    const getFinalTitle = (firstName, lastName, score, bonus, level) => {
      const fullName = `${firstName} ${lastName}`;
      const adjustedScore = getAdjustedScore(score, bonus);
      
      if (adjustedScore >= 95) return `${fullName} - Master (Level ${level})`;
      if (adjustedScore >= 90) return `${fullName} - Expert (Level ${level})`;
      return `${fullName} - Advanced (Level ${level})`;
    };

    // Test nested computed property dependencies
    expect(getAdjustedScore(92, 5)).toBe(97);
    expect(getFinalTitle('Bob', 'Wilson', 92, 5, 3)).toBe('Bob Wilson - Master (Level 3)');
    expect(getFinalTitle('Bob', 'Wilson', 92, -5, 3)).toBe('Bob Wilson - Advanced (Level 3)');
  });

  test('should create user-card component structure', () => {
    const userCardSpec = {
      customElements: [
        {
          tagName: 'user-card',
          $firstName: 'Test',
          $lastName: 'User',
          $score: 85,
          // Computed function instead of getter
          fullName: function() {
            return `${this.$firstName.get()} ${this.$lastName.get()}`;
          },
          children: [
            {
              tagName: 'h3',
              textContent: '${this.parentNode.fullName()}'
            },
            {
              tagName: 'div',
              textContent: 'Score: ${this.parentNode.$score.get()}/100'
            }
          ]
        }
      ]
    };

    // Test that DDOM can process the structure
    expect(() => DDOM(userCardSpec)).not.toThrow();
  });
});