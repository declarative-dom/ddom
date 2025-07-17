import { describe, test, expect, afterEach, beforeEach, vi } from 'vitest';
import { createElement, appendChild, Signal } from '../lib/dist/index.js';

describe('Nested Signal Passing', () => {
  beforeEach(() => {
    // Clean up any global variables
    if (typeof window !== 'undefined') {
      delete window.$selectedItemGroup;
      delete window.$productGroupSelections;
    }
    // Use fake timers to control microtask execution
    vi.useFakeTimers({ toFake: ['nextTick', 'queueMicrotask'] });
  });

  afterEach(() => {
    // Clean up fake timers after each test
    vi.useRealTimers();
  });

  test('should pass signals by reference through array mappings', () => {
    // Set up global signals (like in the real scenario)
    window.$selectedItemGroup = new Signal.State({ choiceIndex: 0, name: 'Products' });
    window.$productGroupSelections = new Signal.State({ Products: 'Gazebos' });

    // Create a parent component with signals (like options-selector)
    const parentElement = createElement({
      tagName: 'div',
      id: 'parent-component',
      $choiceIndex: 0,
      $choiceName: 'Products', 
      $multiSelect: false,
      $selections: 'window.$productGroupSelections',
      $lastSelection: 'window.$selectedItemGroup'
    });

    // Mock the $productGroupOptions function that would exist on the parent
    parentElement.$productGroupOptions = function() {
      return [
        {
          id: 'level-0',
          $choiceName: 'Products',
          choices: ['Custom Structures', 'Garages', 'Gazebos', 'Pavilions', 'Pergolas', 'Sheds', 'Timber Frame Barns']
        }
      ];
    };

    // Get the array data and manually create a child element to test signal passing
    const arrayData = parentElement.$productGroupOptions();
    const childSpec = {
      tagName: 'options-selector-choice',
      id: arrayData[0].id,
      $choiceIndex: 'this.$choiceIndex',      // ← Should get parent's signal
      $choiceName: 'this.$choiceName',        // ← Should get parent's signal  
      $multiSelect: 'this.$multiSelect',      // ← Should get parent's signal
      $selections: 'this.$selections',        // ← Should get global signal reference
      $lastSelection: 'this.$lastSelection'   // ← Should get global signal reference
    };

    // Create child element with parent as context (simulating array mapping)
    const childElement = appendChild(childSpec, parentElement, { 
      css: false,
      scopeProperties: {
        $choiceIndex: parentElement.$choiceIndex,
        $choiceName: parentElement.$choiceName,
        $multiSelect: parentElement.$multiSelect,
        $selections: parentElement.$selections,
        $lastSelection: parentElement.$lastSelection
      }
    });

    vi.runAllTicks(); // Flush microtasks (including reactive effects)

    // Verify the parent has the signals
    expect(parentElement.$choiceIndex).toBeDefined();
    expect(parentElement.$choiceIndex.get()).toBe(0);
    expect(parentElement.$selections.get()).toEqual({ Products: 'Gazebos' });
    expect(parentElement.$lastSelection.get()).toEqual({ choiceIndex: 0, name: 'Products' });

    // Verify child element was created
    expect(childElement).toBeDefined();
    expect(childElement.tagName.toLowerCase()).toBe('options-selector-choice');

    // CRITICAL TEST: Verify signals are passed by reference, not copied
    expect(childElement.$choiceIndex).toBe(parentElement.$choiceIndex);
    expect(childElement.$selections).toBe(parentElement.$selections);
    expect(childElement.$lastSelection).toBe(parentElement.$lastSelection);

    // Verify they point to the same global signals
    expect(childElement.$selections).toBe(window.$productGroupSelections);
    expect(childElement.$lastSelection).toBe(window.$selectedItemGroup);

    // Test reactivity: changes to parent should affect child
    parentElement.$choiceIndex.set(1);
    expect(childElement.$choiceIndex.get()).toBe(1);

    // Test reactivity: changes to global should affect both parent and child
    window.$selectedItemGroup.set({ choiceIndex: 1, name: 'Gazebos' });
    expect(parentElement.$lastSelection.get()).toEqual({ choiceIndex: 1, name: 'Gazebos' });
    expect(childElement.$lastSelection.get()).toEqual({ choiceIndex: 1, name: 'Gazebos' });

    // Verify they're still the same signal object after updates
    expect(childElement.$lastSelection).toBe(window.$selectedItemGroup);
    expect(childElement.$lastSelection).toBe(parentElement.$lastSelection);
  });

  test('should handle multiple levels of signal passing', () => {
    // Create a three-level hierarchy: grandparent → parent → child
    window.$globalState = new Signal.State('initial');

    const grandparentElement = createElement({
      tagName: 'div',
      id: 'grandparent',
      $sharedSignal: 'window.$globalState'
    });

    // Manually create parent element (simulating array mapping)
    const parentElement = appendChild({
      tagName: 'div',
      id: 'parent-1',
      $inheritedSignal: 'this.$sharedSignal',  // ← Should get grandparent's signal
    }, grandparentElement, {
      scopeProperties: {
        $sharedSignal: grandparentElement.$sharedSignal
      }
    });

    // Manually create child element (simulating nested array mapping)
    const childElement = appendChild({
      tagName: 'span',
      id: 'child-1',
      $deepSignal: 'this.$inheritedSignal'  // ← Should get signal from parent (which got it from grandparent)
    }, parentElement, {
      scopeProperties: {
        $inheritedSignal: parentElement.$inheritedSignal
      }
    });

    // Verify the signal chain: grandparent → parent → child
    expect(parentElement.$inheritedSignal).toBe(grandparentElement.$sharedSignal);
    expect(childElement.$deepSignal).toBe(parentElement.$inheritedSignal);
    expect(childElement.$deepSignal).toBe(grandparentElement.$sharedSignal);
    expect(childElement.$deepSignal).toBe(window.$globalState);

    // Test reactivity through the entire chain
    window.$globalState.set('updated');
    expect(grandparentElement.$sharedSignal.get()).toBe('updated');
    expect(parentElement.$inheritedSignal.get()).toBe('updated');
    expect(childElement.$deepSignal.get()).toBe('updated');

    // Verify they're all the same signal object
    expect(childElement.$deepSignal).toBe(window.$globalState);
  });

  test('should handle function references as array sources', () => {
    // Test the specific pattern from your refactor: function references becoming computed signals
    const parentElement = createElement({
      tagName: 'div',
      $sourceData: [1, 2, 3],
      
      // Function that returns processed data (like $productGroupHierarchy)
      $processedData: function() {
        const source = this.$sourceData.get();
        return source.map(num => ({ id: `item-${num}`, value: num * 2 }));
      }
    });

    // Manually test array processing with the function reference
    const processedData = parentElement.$processedData();
    expect(processedData).toHaveLength(3);
    expect(processedData[0]).toEqual({ id: 'item-1', value: 2 });

    // Test creating child elements manually to verify signal passing
    const childElement1 = appendChild({
      tagName: 'div',
      id: processedData[0].id,
      textContent: String(processedData[0].value),
      $parentSignal: 'this.$sourceData' // ← Should get parent's original signal
    }, parentElement, {
      scopeProperties: {
        $sourceData: parentElement.$sourceData
      }
    });

    const childElement2 = appendChild({
      tagName: 'div', 
      id: processedData[1].id,
      textContent: String(processedData[1].value),
      $parentSignal: 'this.$sourceData' // ← Should get parent's original signal
    }, parentElement, {
      scopeProperties: {
        $sourceData: parentElement.$sourceData
      }
    });

    // Verify signal passing works
    expect(childElement1.$parentSignal).toBe(parentElement.$sourceData);
    expect(childElement2.$parentSignal).toBe(parentElement.$sourceData);

    // Test that both children share the same signal reference
    expect(childElement1.$parentSignal).toBe(childElement2.$parentSignal);

    // Test reactivity: changing source should update the processed data function
    parentElement.$sourceData.set([4, 5]);
    const newProcessedData = parentElement.$processedData();
    
    expect(newProcessedData).toHaveLength(2);
    expect(newProcessedData[0]).toEqual({ id: 'item-4', value: 8 }); // 4 * 2
    expect(newProcessedData[1]).toEqual({ id: 'item-5', value: 10 }); // 5 * 2

    // Signal references should still be maintained
    expect(childElement1.$parentSignal).toBe(parentElement.$sourceData);
    expect(childElement1.$parentSignal.get()).toEqual([4, 5]);
  });

  test('should preserve signal identity across array updates', () => {
    // Test that signal references don't get recreated when arrays change
    window.$persistentSignal = new Signal.State('persistent');
    
    const parentElement = createElement({
      tagName: 'div',
      $items: [{ id: 1 }, { id: 2 }],
      $sharedState: 'window.$persistentSignal'
    });

    // Create child elements manually to test signal passing
    const childElement1 = appendChild({
      tagName: 'div',
      id: 'item-1',
      $inherited: 'this.$sharedState'
    }, parentElement, {
      scopeProperties: {
        $sharedState: parentElement.$sharedState
      }
    });

    const childElement2 = appendChild({
      tagName: 'div',
      id: 'item-2', 
      $inherited: 'this.$sharedState'
    }, parentElement, {
      scopeProperties: {
        $sharedState: parentElement.$sharedState
      }
    });

    // Store references to the original child signals
    const firstChildSignal = childElement1.$inherited;
    const secondChildSignal = childElement2.$inherited;

    // Verify they're the same signal initially
    expect(firstChildSignal).toBe(window.$persistentSignal);
    expect(secondChildSignal).toBe(window.$persistentSignal);
    expect(firstChildSignal).toBe(secondChildSignal);

    // Update the array data (simulate array namespace re-rendering)
    parentElement.$items.set([{ id: 1 }, { id: 2 }, { id: 3 }]);

    // Create a new child element (simulating array namespace creating new item)
    const childElement3 = appendChild({
      tagName: 'div',
      id: 'item-3',
      $inherited: 'this.$sharedState'
    }, parentElement, {
      scopeProperties: {
        $sharedState: parentElement.$sharedState
      }
    });

    // Verify the signal references are still the same objects
    expect(childElement1.$inherited).toBe(firstChildSignal);
    expect(childElement2.$inherited).toBe(secondChildSignal);
    expect(childElement3.$inherited).toBe(window.$persistentSignal);

    // All should still be the same signal
    expect(childElement1.$inherited).toBe(childElement2.$inherited);
    expect(childElement2.$inherited).toBe(childElement3.$inherited);
    expect(childElement1.$inherited).toBe(window.$persistentSignal);

    // Test reactivity is maintained
    window.$persistentSignal.set('updated');
    expect(childElement1.$inherited.get()).toBe('updated');
    expect(childElement2.$inherited.get()).toBe('updated');
    expect(childElement3.$inherited.get()).toBe('updated');
  });
});
