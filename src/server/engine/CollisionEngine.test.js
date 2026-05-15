import { describe, it, expect, beforeEach } from 'vitest';
import { CollisionEngine } from './CollisionEngine.js';

describe('CollisionEngine (1.1)', () => {
  let engine;

  beforeEach(() => {
    engine = new CollisionEngine({ padding: 2 });
  });

  it('should detect high-speed tunneling collisions (Swept AABB)', () => {
    // Hunter stationary at 300, 300
    // Visual size 24, padding 2 -> Hitbox 20x20 (290-310)
    const entities = [
      { id: 'hunter', x: 300, y: 300, size: 24 },
      { id: 'prey', x: 325, y: 300, prevX: 275, prevY: 300, size: 24 },
    ];

    const pairs = engine.evaluate(entities);
    expect(pairs.length).toBe(1);
    expect(pairs[0]).toEqual(['hunter', 'prey']);
  });

  it('should NOT detect collision for high-speed near misses', () => {
    // Prey passes Hunter vertically at X=270, not entering the [290-310] X-range
    const entities = [
      { id: 'hunter', x: 300, y: 300, size: 24 },
      { id: 'prey', x: 270, y: 325, prevX: 270, prevY: 275, size: 24 },
    ];

    const pairs = engine.evaluate(entities);
    expect(pairs.length).toBe(0);
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
