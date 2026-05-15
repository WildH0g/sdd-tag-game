import { describe, it, expect, beforeEach } from 'vitest';
import { CollisionEngine } from './CollisionEngine.js';

describe('CollisionEngine (1.1)', () => {
  let engine;

  beforeEach(() => {
    engine = new CollisionEngine({ padding: 2 });
  });

  it('should detect collision for direct overlap', () => {
    const entities = [
      { id: '1', x: 100, y: 100, size: 24 },
      { id: '2', x: 100, y: 100, size: 24 },
    ];

    const pairs = engine.evaluate(entities);
    expect(pairs.length).toBe(1);
    expect(pairs[0]).toEqual(['1', '2']);
  });

  it('should NOT detect collision when separated by more than logical size (padding)', () => {
    // Visual size 24, padding 2 -> Logical size 20
    // Center to center distance 21 -> Should not touch
    const entities = [
      { id: '1', x: 100, y: 100, size: 24 },
      { id: '2', x: 121, y: 100, size: 24 },
    ];

    const pairs = engine.evaluate(entities);
    expect(pairs.length).toBe(0);
  });

  it('should detect collision when separated by less than logical size', () => {
    // Distance 19 < Logical 20
    const entities = [
      { id: '1', x: 100, y: 100, size: 24 },
      { id: '2', x: 119, y: 100, size: 24 },
    ];

    const pairs = engine.evaluate(entities);
    expect(pairs.length).toBe(1);
  });

  it('should handle multiple entities and return unique pairs', () => {
    const entities = [
      { id: 'A', x: 100, y: 100, size: 24 },
      { id: 'B', x: 110, y: 100, size: 24 }, // Hits A
      { id: 'C', x: 200, y: 200, size: 24 }, // Hits nothing
    ];

    const pairs = engine.evaluate(entities);
    expect(pairs.length).toBe(1);
    expect(pairs[0]).toEqual(['A', 'B']);
  });

  it('should be symmetric and avoid duplicate reversed pairs', () => {
    const entities = [
      { id: '1', x: 100, y: 100, size: 24 },
      { id: '2', x: 105, y: 100, size: 24 },
    ];

    const pairs = engine.evaluate(entities);
    // Should only have ['1', '2'], NOT also ['2', '1']
    expect(pairs.length).toBe(1);
  });
});
