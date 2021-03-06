/* globals __DEV__ */
import Phaser from 'phaser';
import Player from '../entites/Player';

import { loadRealm } from '../realms/loadRealm';

import io from 'socket.io-client';

export default class extends Phaser.State {
  init () {}
  preload () {}

  /*
  #####################################################################################################################
  ################################################ CREATION METHODS BELOW #############################################
  #####################################################################################################################
  #####################################################################################################################
  */
  create () {
    this.isLoading = true;
    this.stage.disableVisibilityChange = true;
    this.game.physics.startSystem(Phaser.Physics.P2JS);
    this.game.physics.p2.setImpactEvents(true);

    this.playerCollisionGroup = this.game.physics.p2.createCollisionGroup();
    this.itemCollisionGroup = this.game.physics.p2.createCollisionGroup();
    this.entitesCollisionGroup = this.game.physics.p2.createCollisionGroup();
    this.game.physics.p2.updateBoundsCollisionGroup();

    this.guiGroup = this.game.add.group();

    this.menuGroup = this.game.add.group();
    this.menuGroup.visible = false;

    this.itemsGroup = this.game.add.group();
    this.itemsGroup.enableBody = true;
    this.itemsGroup.physicsBodyType = Phaser.Physics.P2JS;

    this.entitesGroup = this.game.add.group();
    this.entitesGroup.enableBody = true;
    this.entitesGroup.physicsBodyType = Phaser.Physics.P2JS;

    this.createControls();
    this.createPlayer();
    this.createGUI();

    loadRealm(this).then(() => {
      this.socket = io('http://192.168.1.23:5000');

      this.socket.on('connect', function(data) {
        console.log("IO Connection Made: " + data);
      });

      this.socket.on('disconnect', function(data) {
        console.log("IO Connection Lost: " + data);
      });

      this.socket.on('update', function() {
        console.log('Update Sent');
      });
    });

    /*var emitter = this.game.add.emitter(1000, 500, 5);
    emitter.makeParticles('spark');
    emitter.setAlpha(0.3, 0.8);
    emitter.setScale(0.5, 1);
    emitter.flow(1000, 0, 5, 1, true);
    emitter.gravity = 0;
    emitter.start(false, 500, 1);*/
  }

  createControls() {
    this.controls = {
      up: null,
      down: null,
      left: null,
      right: null,
      use: null,
      pickUp: null,
      drop: null,
      menu: null
    }

    this.controls.up = this.game.input.keyboard.addKey(Phaser.KeyCode.W);
    this.controls.down = this.game.input.keyboard.addKey(Phaser.KeyCode.S);
    this.controls.left = this.game.input.keyboard.addKey(Phaser.KeyCode.A);
    this.controls.right = this.game.input.keyboard.addKey(Phaser.KeyCode.D);
    this.controls.use = this.game.input.mousePointer.leftButton;
    this.controls.drop = this.game.input.mousePointer.rightButton;
    this.controls.pickUp = this.game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);
    this.controls.menu = this.game.input.keyboard.addKey(Phaser.KeyCode.M);
  }

  createGUI() {
    var menu = this.menuGroup.create(
      this.game.width/2,
      this.game.height/2,
      'panel');
    menu.scale.setTo(3, 3);

    this.player.healthBar = this.guiGroup.create(
      this.game.camera.view.x - (this.game.camera.view.x - 10),
      this.game.camera.view.y - (this.game.camera.view.y - 10),
      'hpmana_bar');

    this.player.manaBar = this.guiGroup.create(
      this.game.camera.view.x - (this.game.camera.view.x - 10),
      this.game.camera.view.y - (this.game.camera.view.y - 25),
      'hpmana_bar');

    this.player.healthBar.scale.setTo(1.5, 1.5);
    this.player.manaBar.scale.setTo(1.5, 1.5);

    var bmd = game.add.bitmapData(this.player.healthBar.width-5, this.player.healthBar.height-2);
    bmd.ctx.beginPath();
    bmd.ctx.rect(2, 0, this.player.healthBar.width-5, this.player.healthBar.height-2);
    bmd.ctx.fillStyle = '#ff0000';
    bmd.ctx.fill();
    this.player.healthBarFill = this.guiGroup.create(
      this.game.camera.view.x - (this.game.camera.view.x - 10),
      this.game.camera.view.y - (this.game.camera.view.y - 10),
      bmd);
    this.player.healthBarFill.fullWidth = this.player.healthBarFill.width;

    bmd = game.add.bitmapData(this.player.manaBar.width-5, this.player.manaBar.height-2);
    bmd.ctx.beginPath();
    bmd.ctx.rect(2, 0, this.player.manaBar.width-5, this.player.manaBar.height-2);
    bmd.ctx.fillStyle = '#0099ff';
    bmd.ctx.fill();
    this.player.manaBarFill = this.guiGroup.create(
      this.game.camera.view.x - (this.game.camera.view.x - 10),
      this.game.camera.view.y - (this.game.camera.view.y - 25),
      bmd);
    this.player.manaBarFill.fullWidth = this.player.manaBarFill.width;

    this.player.healthBar.bringToTop();
    this.player.manaBar.bringToTop();
  }

  createPlayer() {
    this.player = new Player(this.game, 50, 50, 'warrior');
    this.game.add.existing(this.player);
    this.game.physics.p2.enable(this.player, false);
    this.player.body.collideWorldBounds = true;
    this.player.body.fixedRotation = true;
    this.player.body.setRectangle(20, 30);
    this.player.body.setCollisionGroup(this.playerCollisionGroup);
    this.createPlayerCollisionCallBacks();

    this.controls.left.onDown.add(() => {
      this.player.animations.play('warrior_running_left');
      this.player.prevAnimation = 'warrior_idle_left';
    }, this);

    this.controls.right.onDown.add(() => {
      this.player.animations.play('warrior_running_right');
      this.player.prevAnimation = 'warrior_idle_right';
    }, this);

    this.controls.menu.onDown.add(() => {
      this.menuGroup.visible = !this.menuGroup.visible;
    }, this);

    this.game.camera.follow(this.player, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1);
    this.game.time.events.loop(Phaser.Timer.SECOND, function(){this.player.health -= 1}, this);
  }

  createPlayerCollisionCallBacks() {
    this.player.body.collides(this.itemCollisionGroup, (b1, b2) => {
      console.log("Collided with item!");
    }, this);
    this.player.body.collides(this.entitesCollisionGroup, (b1, b2) => {
      console.log("Collided with entity!");
    }, this);
  }

  checkOverlapManually(enemy) {
    for (var i =0 ; i<enemies.length; i++){
      var dx = ship.body.x-enemy.body.x;  //distance ship X to enemy X
      var dy = ship.body.y -enemy.body.y;  //distance ship Y to enemy Y
      var dist = Math.sqrt(dx*dx + dy*dy);     //pythagoras ^^  (get the distance to each other)
      if (dist < shipdiameter+bulletdiameter){  // if distance to each other is smaller than both radii together a collision/overlap is happening
        dosomething(enemy);
      }
    }
  }

  checkOverlap(spriteA, spriteB) {
    var boundsA = spriteA.getBounds();
    var boundsB = spriteB.getBounds();
    boundsA.x = spriteA.position.x; boundsA.y = spriteA.position.y;
    boundsB.x = spriteB.position.x; boundsB.y = spriteB.position.y;
    return Phaser.Rectangle.intersects(boundsA, boundsB);
  }

  /*
  #####################################################################################################################
  #####################################################################################################################
  #####################################################################################################################
  #####################################################################################################################
  */


  /*
  #####################################################################################################################
  ################################################# UPDATE METHODS BELOW ##############################################
  #####################################################################################################################
  #####################################################################################################################
  */
  update() {
    this.updateGUI();
    this.updatePlayer();
  }

  updateGUI() {
    if(this.player.healthBarFill.width > 0) {
      let healthP = this.player.health / this.player.maxHealth;
      this.player.healthBarFill.width = (healthP * this.player.healthBarFill.fullWidth);
    }

    if(this.player.manaBarFill.width > 0) {
      let manaP = this.player.mana / this.player.maxMana;
      this.player.manaBarFill.width = (manaP * this.player.manaBarFill.fullWidth);
    }

    this.player.healthBar.x = this.game.camera.view.x + 10;
    this.player.healthBar.y = this.game.camera.view.y + 10;
    this.player.manaBar.x = this.game.camera.view.x + 10;
    this.player.manaBar.y = this.game.camera.view.y + 25;
    this.player.healthBarFill.x = this.game.camera.view.x + 10;
    this.player.healthBarFill.y = this.game.camera.view.y + 10;
    this.player.manaBarFill.x = this.game.camera.view.x + 10;
    this.player.manaBarFill.y = this.game.camera.view.y + 25;
  }

  updatePlayer() {
    this.player.body.setZeroVelocity();
    this.controls.up.isDown ? this.player.body.moveUp(200) : null
    this.controls.down.isDown ? this.player.body.moveDown(200) : null
    this.controls.left.isDown ? this.player.body.moveLeft(200) : null
    this.controls.right.isDown ? this.player.body.moveRight(200) : null

    if(this.player.prevPosition.x != this.player.position.x || this.player.prevPosition.y != this.player.position.y) {
      this.socket.emit('update', {'move': {x: this.player.position.x, y: this.player.position.y}});
    }

    this.player.prevPosition = this.player.position;

    if(!this.controls.left.isDown && !this.controls.right.isDown && !this.controls.up.isDown && !this.controls.down.isDown) {
      this.player.animations.play(this.player.prevAnimation);
    }

    const { x, y } = this.player.position;
    const { height, width } = this.world.bounds;

    if(x - 10 < 0) {
      //left world boundary
      this.socket.emit('update', {'update': 'realmLeft'}, () => {
        console.log("Moving to left realm...")
      });
    } else if(x + 10 > width) {
      //right world boundary
      this.socket.emit('update', {'update': 'realmRight'}, () => {
        console.log("Moving to right realm...")
      });
    } else if(y - 15 < 0) {
      //top world boundary
      this.socket.emit('update', {'update': 'realmUp'}, () => {
        console.log("Moving to top realm...")
      });
    } else if(y + 15 > height) {
      //bottom world boundary
      this.socket.emit('update', {'update': 'realmDown'}, () => {
        console.log("Moving to bottom realm...")
      });
    }
  }
  /*
  #####################################################################################################################
  #####################################################################################################################
  #####################################################################################################################
  #####################################################################################################################
  */

  render () {}
}
