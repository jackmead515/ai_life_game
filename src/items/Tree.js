import Item from './Item';

export default class Tree extends Item {
  constructor(game, x, y) {
    super(game);
    this.sprite = game.add.sprite(x, y, 'tree');
    this.bottomSprite = game.add.sprite(x, y, 'bottom_tree');
  }
}