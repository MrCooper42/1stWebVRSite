var debug = AFRAME.utils.debug;
var coordinates = AFRAME.utils.coordinates;

var warn = debug('components:look-at:warn');
var isCoordinate = coordinates.isCoordinate;

delete AFRAME.components['look-at'];

/**
 * Look-at component.
 *
 * Modifies rotation to either track another entity OR do a one-time turn towards a position
 * vector.
 *
 * If tracking an object via setting the component value via a selector, look-at will register
 * a behavior to the scene to update rotation on every tick.
 */
AFRAME.registerComponent('look-at', {
  schema: {
    default: '',

    parse: function(value) {
      // A static position to look at.
      if (isCoordinate(value) || typeof value === 'object') {
        return coordinates.parse(value);
      }
      // A selector to a target entity.
      return value;
    },

    stringify: function(data) {
      if (typeof data === 'object') {
        return coordinates.stringify(data);
      }
      return data;
    }
  },

  init: function() {
    this.target3D = null;
    this.vector = new THREE.Vector3();
  },

  /**
   * If tracking an object, this will be called on every tick.
   * If looking at a position vector, this will only be called once (until further updates).
   */
  update: function() {
    var self = this;
    var target = self.data;
    var object3D = self.el.object3D;
    var targetEl;

    // No longer looking at anything (i.e., look-at="").
    if (!target || (typeof target === 'object' && !Object.keys(target).length)) {
      return self.remove();
    }

    // Look at a position.
    if (typeof target === 'object') {
      return object3D.lookAt(new THREE.Vector3(target.x, target.y, target.z));
    }

    // Assume target is a string.
    // Query for the element, grab its object3D, then register a behavior on the scene to
    // track the target on every tick.
    targetEl = self.el.sceneEl.querySelector(target);
    if (!targetEl) {
      warn('"' + target + '" does not point to a valid entity to look-at');
      return;
    }
    if (!targetEl.hasLoaded) {
      return targetEl.addEventListener('loaded', function() {
        self.beginTracking(targetEl);
      });
    }
    return self.beginTracking(targetEl);
  },

  tick: function(t) {
    // Track target object position. Depends on parent object keeping global transforms up
    // to state with updateMatrixWorld(). In practice, this is handled by the renderer.
    var target3D = this.target3D;
    if (target3D) {
      return this.el.object3D.lookAt(this.vector.setFromMatrixPosition(target3D.matrixWorld));
    }
  },

  beginTracking: function(targetEl) {
    this.target3D = targetEl.object3D;
  }
});

/* globals AFRAME */
if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME' +
    ' was available.');
}

/**
 * Hyper Link component for A-Frame.
 */
AFRAME.registerComponent('href', {
  schema: {
    default: ''
  },

  boundClickHandler: undefined,

  clickHandler: function hrefClickHandler() {
    var url = this.data;
    var target = this.el.getAttribute('target');
    console.log('link to ' + url);
    if (url && url[0] === '#') { // in-page anchor
      var ele = document.querySelector(url);
      var cams = document.querySelectorAll('a-camera');
      if (ele && cams) {
        var targetPosition = ele.getAttribute('position');
        console.log('focus camera to position:' +
          JSON.stringify(targetPosition));
        cams[0].setAttribute('position', targetPosition);
        window.location.hash = url;
      } else {
        console.log('#id or a-camera is not defined');
      }
    } else { // normal hyper link
      if (target) {
        var animation = '';
        var exitAnimation = null;
        console.log('target to ' + target);
        if (target.indexOf('#') >= 0) {
          var li = target.split('#');
          target = li[0];
          animation = li[1];
          console.log('target to ' + target + ' & animate ' + animation);
        }
        switch(target) {
        case '_blank':
          if (animation) {
            exitAnimation = document.getElementById(animation);
            exitAnimation.addEventListener('animationend',
              function animationendHandler() {
                exitAnimation.removeEventListener('animationend',
                  animationendHandler);
                window.open(url);
              });
            this.el.emit('href');
          } else {
            window.open(url);
          }
          break;
        case 'window':
        default:
          if (animation) {
            exitAnimation = document.getElementById(animation);
            exitAnimation.addEventListener('animationend',
              function animationendHandler() {
                exitAnimation.removeEventListener('animationend',
                  animationendHandler);
                window.location.href = url;
              });
            this.el.emit('href');
          } else {
            window.location.href = url;
          }
          break;
        }
      } else {
        window.location.href = url;
      }
    }
  },

  /**
   * Called once when component is attached. Generally for initial setup.
   */
  init: function() {
    this.boundClickHandler = this.clickHandler.bind(this);
    this.el.addEventListener('click', this.boundClickHandler);
  },

  /**
   * Called when a component is removed (e.g., via removeAttribute).
   * Generally undoes all modifications to the entity.
   */
  remove: function() {
    this.el.removeEventListener('click', this.boundClickHandler);
  }
});
