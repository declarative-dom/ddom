import { describe, test, expect, beforeEach } from 'vitest';
import DDOM, { createElement } from '../lib/dist/index.js';

describe('Mixed Children Support', () => {
  beforeEach(() => {
    // Clean up any global variables
    const testProps = ['$todos', '$comments'];
    testProps.forEach(prop => {
      delete window[prop];
    });
  });

  test('should support mixed static and dynamic children', () => {
    const parentDiv = createElement({
      tagName: 'main',
      children: [
        { tagName: 'header', textContent: 'Welcome Header' },
        { 
          items: ['Todo 1', 'Todo 2', 'Todo 3'],
          map: (item, index) => ({
            tagName: 'div',
            className: 'todo-item',
            textContent: `${index + 1}: ${item}`
          })
        },
        { tagName: 'footer', textContent: 'Static Footer' }
      ]
    });

    expect(parentDiv).toBeDefined();
    expect(parentDiv.children.length).toBe(5); // header + 3 todos + footer
    
    // Check header
    expect(parentDiv.children[0].tagName.toLowerCase()).toBe('header');
    expect(parentDiv.children[0].textContent).toBe('Welcome Header');
    
    // Check todo items
    expect(parentDiv.children[1].className).toBe('todo-item');
    expect(parentDiv.children[1].textContent).toBe('1: Todo 1');
    expect(parentDiv.children[2].className).toBe('todo-item');
    expect(parentDiv.children[2].textContent).toBe('2: Todo 2');
    expect(parentDiv.children[3].className).toBe('todo-item');
    expect(parentDiv.children[3].textContent).toBe('3: Todo 3');
    
    // Check footer
    expect(parentDiv.children[4].tagName.toLowerCase()).toBe('footer');
    expect(parentDiv.children[4].textContent).toBe('Static Footer');
  });

  test('should handle multiple MappedArrayExpr in mixed children', () => {
    const containerDiv = createElement({
      tagName: 'div',
      className: 'container',
      children: [
        { tagName: 'nav', textContent: 'Navigation' },
        { 
          items: ['Article 1', 'Article 2'],
          map: (article) => ({
            tagName: 'article',
            className: 'article',
            textContent: article
          })
        },
        { tagName: 'aside', textContent: 'Sidebar' },
        {
          items: ['Comment 1', 'Comment 2'],
          map: (comment) => ({
            tagName: 'div',
            className: 'comment',
            textContent: comment
          })
        }
      ]
    });

    expect(containerDiv.children.length).toBe(6); // nav + 2 articles + aside + 2 comments
    
    // Check nav
    expect(containerDiv.children[0].tagName.toLowerCase()).toBe('nav');
    expect(containerDiv.children[0].textContent).toBe('Navigation');
    
    // Check articles
    expect(containerDiv.children[1].className).toBe('article');
    expect(containerDiv.children[1].textContent).toBe('Article 1');
    expect(containerDiv.children[2].className).toBe('article');
    expect(containerDiv.children[2].textContent).toBe('Article 2');
    
    // Check aside
    expect(containerDiv.children[3].tagName.toLowerCase()).toBe('aside');
    expect(containerDiv.children[3].textContent).toBe('Sidebar');
    
    // Check comments
    expect(containerDiv.children[4].className).toBe('comment');
    expect(containerDiv.children[4].textContent).toBe('Comment 1');
    expect(containerDiv.children[5].className).toBe('comment');
    expect(containerDiv.children[5].textContent).toBe('Comment 2');
  });

  test('should maintain backward compatibility with pure HTMLElementSpec arrays', () => {
    const listDiv = createElement({
      tagName: 'ul',
      children: [
        { tagName: 'li', textContent: 'Item 1' },
        { tagName: 'li', textContent: 'Item 2' },
        { tagName: 'li', textContent: 'Item 3' }
      ]
    });

    expect(listDiv.children.length).toBe(3);
    expect(listDiv.children[0].textContent).toBe('Item 1');
    expect(listDiv.children[1].textContent).toBe('Item 2');
    expect(listDiv.children[2].textContent).toBe('Item 3');
  });

  test('should maintain backward compatibility with single MappedArrayExpr', () => {
    const listDiv = createElement({
      tagName: 'div',
      children: {
        items: [1, 2, 3],
        map: (item) => ({
          tagName: 'span',
          textContent: `Item: ${item}`
        })
      }
    });

    expect(listDiv.children.length).toBe(3);
    expect(listDiv.children[0].tagName.toLowerCase()).toBe('span');
    expect(listDiv.children[0].textContent).toBe('Item: 1');
    expect(listDiv.children[1].textContent).toBe('Item: 2');
    expect(listDiv.children[2].textContent).toBe('Item: 3');
  });

  test('should support complex nested mixed children', () => {
    const complexDiv = createElement({
      tagName: 'div',
      className: 'complex-layout',
      children: [
        { 
          tagName: 'header',
          children: [
            { tagName: 'h1', textContent: 'Page Title' },
            {
              items: ['Home', 'About', 'Contact'],
              map: (link) => ({
                tagName: 'a',
                href: `/${link.toLowerCase()}`,
                textContent: link
              })
            }
          ]
        },
        {
          tagName: 'main',
          children: [
            { tagName: 'p', textContent: 'Main content paragraph' },
            {
              items: [
                { title: 'Post 1', content: 'Content 1' },
                { title: 'Post 2', content: 'Content 2' }
              ],
              map: (post) => ({
                tagName: 'article',
                children: [
                  { tagName: 'h2', textContent: post.title },
                  { tagName: 'p', textContent: post.content }
                ]
              })
            }
          ]
        }
      ]
    });

    expect(complexDiv.children.length).toBe(2); // header + main
    
    const header = complexDiv.children[0];
    expect(header.tagName.toLowerCase()).toBe('header');
    expect(header.children.length).toBe(4); // h1 + 3 nav links
    expect(header.children[0].textContent).toBe('Page Title');
    expect(header.children[1].tagName.toLowerCase()).toBe('a');
    expect(header.children[1].textContent).toBe('Home');
    
    const main = complexDiv.children[1];
    expect(main.tagName.toLowerCase()).toBe('main');
    expect(main.children.length).toBe(3); // p + 2 articles
    expect(main.children[0].textContent).toBe('Main content paragraph');
    expect(main.children[1].tagName.toLowerCase()).toBe('article');
    expect(main.children[1].children.length).toBe(2); // h2 + p
    expect(main.children[1].children[0].textContent).toBe('Post 1');
  });

  test('should handle empty MappedArrayExpr in mixed children', () => {
    const containerDiv = createElement({
      tagName: 'div',
      children: [
        { tagName: 'p', textContent: 'Before empty list' },
        { 
          items: [],
          map: (item) => ({
            tagName: 'span',
            textContent: item
          })
        },
        { tagName: 'p', textContent: 'After empty list' }
      ]
    });

    expect(containerDiv.children.length).toBe(2); // Only the two p elements
    expect(containerDiv.children[0].textContent).toBe('Before empty list');
    expect(containerDiv.children[1].textContent).toBe('After empty list');
  });
});