AFRAME.registerComponent('click-listener', {
  //when window is clicked, emit click event from the entity.
  init: function() {
    var el = this.el;
    window.addEventListener('click', function() {
      el.emit('click', null, false);
    });
  }
});

AFRAME.registerComponent('spawner', {
  schema: {
    on: {
      default: 'click'
    },
    mixin: {
      default: ''
    }
  },
  //Add event listener to entity that when emmited, spawns the entity.
  update: function(oldData) {
    this.el.addEventListener(this.data.on, this.spawn.bind(this));
  },
  //spawn new entity with a mixin of components at the entity's curr position.
  spawn: function() {
    var el = this.el;
    var entity = document.createElement('a-entity');
    var matrixWorld = el.object3D.matrixWorld;
    var position = new THREE.Vector3();
    var rotation = el.getAttribute('rotation');
    var entityRotation;

    position.setFromMatrixPosition(matrixWorld);
    entity.setAttribute('position', position);

    // have the spawned entity face same direction as entity
    // Allow entity to further modify the inherited rotation.
    position.setFromMatrixPosition(matrixWorld);
    entity.setAttribute('position', position);
    entity.setAttribute('mixin', this.data.mixin);
    entity.addEventListener('loaded', function() {
      entityRotation = entity.getComputedAttribute('rotation');
      entity.setAttribute('rotation', {
        x: entityRotation.x + rotation.x,
        y: entityRotation.y + rotation.y,
        z: entityRotation.z + rotation.z
      })
    });
    el.sceneEl.appendChild(entity);
  }
});

AFRAME.registerComponent('projectile', {
  schema: {
    speed: {
      default: -0.4
    }
  },

  tick: function() {
    this.el.object3D.translateY(this.data.speed);
  }
});


AFRAME.registerComponent('collider', {
  schema: {
    target: {
      default: ''
    }
  },

  //calculate targets
  init: function() {
    var targetEls = this.el.sceneEl.querySelectorAll(this.data.target);
    this.targets = [];
    for (var i = 0; i < targetEls.length; i++) {
      this.targets.push(targetEls[i].object3D);
      console.log("this.targ init arr", this.targets);
    }
    this.el.object3D.updateMatrixWorld();
  },

  // check for collisions
  tick: function(t) {
    var collisionResults;
    var directionVector;
    var el = this.el;
    var sceneEl = el.sceneEl;
    var mesh = el.getObject3D('mesh');
    var object3D = el.object3D;
    var raycaster;
    var vertices = mesh.geometry.vertices;
    var bottomVertex = vertices[0].clone();
    var topVertex = vertices[vertices.length - 1].clone();

    //Calculate absolute positions of start and end of entity.
    bottomVertex.applyMatrix4(object3D.matrixWorld);
    topVertex.applyMatrix4(object3D.matrixWorld);

    //Dirction vector from start to end of entity.
    directionVector = topVertex.clone().sub(bottomVertex, directionVector, 1);

    //raycast for collisions
    raycaster = new THREE.Raycaster(bottomVertex, directionVector, 1);
    collisionResults = raycaster.intersectObjects(this.targets, true);
    collisionResults.forEach(function(target) {
      // tell collided entity about the collision.
      target.object.el.emit('collider-hit', {
        target: el
      });
    });
  }
});






//
//   use this by doing <a-scene auto-eneter-vr>
// AFRAME.registerComponent('auto-enter-vr', {
//   init: function () {
//     this.el.sceneEl.enterVR();
//   }
// });
