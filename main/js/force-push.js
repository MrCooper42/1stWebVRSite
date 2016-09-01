/**
 * Rain of Entities component.
 *
 * Creates a spawner on the scene, which periodically generates new entities
 * and drops them from the sky. Objects falling below altitude=0 will be
 * recycled after a few seconds.
 *
 * Requires: physics
 */
AFRAME.registerComponent('rain-of-entities', {
  schema: {
    tagName: {
      default: 'a-box'
    },
    components: {
      default: ['dynamic-body', 'force-pushable', 'color|#39BB82']
    },
    maxCount: {
      default: 10,
      min: 0
    },
    interval: {
      default: 1000,
      min: 0
    },
    lifetime: {
      default: 10000,
      min: 0
    }
  },
  init: function() {
    this.boxes = [];
    this.timeout = setInterval(this.spawn.bind(this), this.data.interval);
  },
  spawn: function() {
    if (this.boxes.length >= this.data.maxCount) {
      clearTimeout(this.timeout);

      return;
    }

    var data = this.data,
      box = document.createElement(data.tagName);

    this.boxes.push(box);
    this.el.appendChild(box);

    box.setAttribute('position', this.randomPosition());
    data.components.forEach(function(s) {
      var parts = s.split('|');
      box.setAttribute(parts[0], parts[1] || '');
    });

    // Recycling is important, kids.
    setInterval(function() {
      if (box.body.position.y > 0) return;
      box.body.position.copy(this.randomPosition());
      box.body.velocity.set(0, 0, 0);
    }.bind(this), this.data.lifetime);
  },
  randomPosition: function() {
    return {
      x: Math.random() * 10 - 5,
      y: 10,
      z: Math.random() * 10 - 5
    };
  }
});

/**
 * Force Pushable component.
 *
 * Applies behavior to the current entity such that cursor clicks will apply a
 * strong impulse, pushing the entity away from the viewer.
 *
 * Requires: physics
 */
AFRAME.registerComponent('force-pushable', {
  schema: {
    force: {
      default: 100
    }
  },
  init: function() {
    this.pStart = new THREE.Vector3();
    this.sourceEl = this.el.sceneEl.querySelector('[camera]');
    this.el.addEventListener('click', this.forcePush.bind(this));
  },
  forcePush: function() {
    var force,
      el = this.el,
      pStart = this.pStart.copy(this.sourceEl.getComputedAttribute('position'));

    // Compute direction of force, normalize, then scale.
    force = el.body.position.vsub(pStart);
    force.normalize();
    force.scale(this.data.force, force);

    el.body.applyImpulse(force, el.body.position);
  }
});

/**
 * Force Float component.
 *
 * Applies behavior to the scene in which a keypress (default: Spacebar) will
 * temporarily disable gravity and apply a small upward impulse to target
 * entities.
 *
 * Requires: physics
 */
AFRAME.registerComponent('force-float', {
  schema: {
    force: {
      default: 1.0
    },
    keyCode: {
      default: 32
    },
    selector: {
      default: '[force-float-target]'
    }
  },

  init: function() {
    this.isFloating = false;
    document.addEventListener('keyup', this.onKeyup.bind(this));
  },

  onKeyup: function(e) {
    if (e.keyCode !== this.data.keyCode) return;

    var data = this.data,
      isFloating = this.isFloating,
      physics = this.el.sceneEl.systems.physics,
      targets = this.el.sceneEl.querySelectorAll(data.selector);

    if (isFloating) {
      physics.setOption('gravity', this.gravity);
    } else {
      // Disable gravity.
      this.gravity = physics.options.gravity;
      physics.setOption('gravity', 0);

      // Lift targets slightly.
      targets = [].slice.call(targets).forEach(function(el) {
        var position = new CANNON.Vec3().copy(el.getComputedAttribute('position')),
          impulse = new CANNON.Vec3(
            0.25 * data.force * Math.random(),
            1.00 * data.force * Math.random() + 1.5,
            0.25 * data.force * Math.random()
          );
        el.body.applyImpulse(impulse, position);
      });
    }

    this.isFloating = !isFloating;
  }
});
