import { describe, test, expect, beforeEach } from 'vitest';
import { createElement, Signal } from '../lib/dist/index.js';

describe('Nested Signal Passing', () => {
  beforeEach(() => {
    // Clean up any global variables
    if (typeof window !== 'undefined') {
      delete window.$selectedItemGroup;
      delete window.$productGroupSelections;
    }
  });

  test('should pass signals by reference through array mappings', () => {
    // Set up global signals (like in the real scenario)
    window.$selectedItemGroup = new Signal.State({ choiceIndex: 0, name: 'Products' });
    window.$productGroupSelections = new Signal.State({ Products: 'Gazebos' });

    // Create a parent component with signals (like options-selector)
    const parentElement = createElement({
      tagName: 'div',
      id: 'parent-component',
      $choiceIndex: new Signal.State(0),
      $choiceName: new Signal.State('Products'), 
      $multiSelect: new Signal.State(false),
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

    // Create the array namespace with nested components
    const childrenArray = createElement({
      tagName: 'div',
      children: {
        prototype: 'Array',
        items: 'this.$productGroupOptions',
        map: {
          tagName: 'options-selector-choice',
          id: '${item.id}',
          $choiceIndex: 'this.$choiceIndex',      // ← Should get parent's signal
          $choiceName: 'this.$choiceName',        // ← Should get parent's signal  
          $multiSelect: 'this.$multiSelect',      // ← Should get parent's signal
          $selections: 'this.$selections',        // ← Should get global signal reference
          $lastSelection: 'this.$lastSelection'   // ← Should get global signal reference
        }
      }
    }, parentElement);

    // Verify the parent has the signals
    expect(parentElement.$choiceIndex).toBeDefined();
    expect(parentElement.$choiceIndex.get()).toBe(0);
    expect(parentElement.$selections.get()).toEqual({ Products: 'Gazebos' });
    expect(parentElement.$lastSelection.get()).toEqual({ choiceIndex: 0, name: 'Products' });

    // Get the child element that was created by the array mapping
    const childElement = childrenArray.children[0];
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

    grandparentElement.$getParentData = function() {
      return [{ id: 'parent-1', data: 'parent-data' }];
    };

    const parentContainer = createElement({
      tagName: 'div',
      children: {
        prototype: 'Array', 
        items: 'this.$getParentData',
        map: {
          tagName: 'div',
          id: '${item.id}',
          $inheritedSignal: 'this.$sharedSignal',  // ← Should get grandparent's signal
          $getChildData: function() {
            return [{ id: 'child-1', value: 'child-value' }];
          },
          children: {
            prototype: 'Array',
            items: 'this.$getChildData', 
            map: {
              tagName: 'span',
              id: '${item.id}',
              $deepSignal: 'this.$inheritedSignal'  // ← Should get signal from parent (which got it from grandparent)
            }
          }
        }
      }
    }, grandparentElement);

    const parentElement = parentContainer.children[0];
    const childElement = parentElement.children[0];

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
      $sourceData: new Signal.State([1, 2, 3]),
      
      // Function that returns processed data (like $productGroupHierarchy)
      $processedData: function() {
        const source = this.$sourceData.get();
        return source.map(num => ({ id: `item-${num}`, value: num * 2 }));
      }
    });

    const arrayContainer = createElement({
      tagName: 'div',
      children: {
        prototype: 'Array',
        items: 'this.$processedData', // ← Function reference should become computed signal
        map: {
          tagName: 'div',
          id: '${item.id}',
          textContent: '${item.value}',
          $parentSignal: 'this.$sourceData' // ← Should get parent's original signal
        }
      }
    }, parentElement);

    // Verify the function was converted to a computed signal and works
    expect(arrayContainer.children).toHaveLength(3);
    expect(arrayContainer.children[0].id).toBe('item-1');
    expect(arrayContainer.children[0].textContent).toBe('2');
    expect(arrayContainer.children[1].textContent).toBe('4');
    expect(arrayContainer.children[2].textContent).toBe('6');

    // Verify signal passing works
    expect(arrayContainer.children[0].$parentSignal).toBe(parentElement.$sourceData);

    // Test reactivity: changing source should update computed array
    parentElement.$sourceData.set([4, 5]);
    
    // The array should update to reflect the new data
    expect(arrayContainer.children).toHaveLength(2);
    expect(arrayContainer.children[0].textContent).toBe('8');  // 4 * 2
    expect(arrayContainer.children[1].textContent).toBe('10'); // 5 * 2

    // Signal references should still be maintained
    expect(arrayContainer.children[0].$parentSignal).toBe(parentElement.$sourceData);
  });

  test('should preserve signal identity across array updates', () => {
    // Test that signal references don't get recreated when arrays change
    window.$persistentSignal = new Signal.State('persistent');
    
    const parentElement = createElement({
      tagName: 'div',
      $items: new Signal.State([{ id: 1 }, { id: 2 }]),
      $sharedState: 'window.$persistentSignal'
    });

    parentElement.$getItems = function() {
      return this.$items.get();
    };

    const arrayContainer = createElement({
      tagName: 'div',
      children: {
        prototype: 'Array',
        items: 'this.$getItems',
        map: {
          tagName: 'div',
          id: 'item-${item.id}',
          $inherited: 'this.$sharedState'
        }
      }
    }, parentElement);

    // Store references to the original child signals
    const firstChildSignal = arrayContainer.children[0].$inherited;
    const secondChildSignal = arrayContainer.children[1].$inherited;

    // Verify they're the same signal initially
    expect(firstChildSignal).toBe(window.$persistentSignal);
    expect(secondChildSignal).toBe(window.$persistentSignal);
    expect(firstChildSignal).toBe(secondChildSignal);

    // Update the array data
    parentElement.$items.set([{ id: 1 }, { id: 2 }, { id: 3 }]);

    // Verify the signal references are still the same objects after array update
    expect(arrayContainer.children[0].$inherited).toBe(firstChildSignal);
    expect(arrayContainer.children[1].$inherited).toBe(secondChildSignal);
    expect(arrayContainer.children[2].$inherited).toBe(window.$persistentSignal);

    // All should still be the same signal
    expect(arrayContainer.children[0].$inherited).toBe(arrayContainer.children[1].$inherited);
    expect(arrayContainer.children[1].$inherited).toBe(arrayContainer.children[2].$inherited);
  });
});
