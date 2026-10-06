/**
 * LIVING TYPE — Shaders
 * Vertex and Fragment shaders for soft physical typography simulation.
 * Evaluates continuous viscoelastic deformation, acoustic wave ripples,
 * tensile drag strain, and micro-refractive edge optics.
 */

export const VERTEX_SHADER_SOURCE = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = (a_position + 1.0) * 0.5;
    // Flip Y for texture coordinates standard
    v_uv.y = 1.0 - v_uv.y;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

export const FRAGMENT_SHADER_SOURCE = `
  precision highp float;

  varying vec2 v_uv;
  uniform sampler2D u_texture;
  uniform vec2 u_resolution;
  uniform float u_time;

  // Pointer Proximity Interaction
  uniform vec2 u_pointer;          // normalized [0, 1]
  uniform vec2 u_pointer_vel;      // normalized velocity
  uniform float u_pointer_active;  // 1.0 if inside canvas, 0.0 if left
  uniform float u_hover_radius;    // radius of deformation in aspect units
  uniform float u_hover_strength;  // displacement magnitude

  // Drag Interaction (Tensile Stretch & Recoil)
  uniform vec2 u_drag_origin;      // drag grab point
  uniform vec2 u_drag_offset;      // spring-offset displacement
  uniform float u_drag_radius;      // grab influence radius
  uniform float u_drag_active;      // 1.0 if active / recoiling, 0.0 if idle

  // Acoustic Wave Ripples (Bounded to 8)
  struct Ripple {
    vec2 origin;
    float startTime;
    float speed;
    float amplitude;
    float frequency;
    float decay;
    float width;
    float duration;
  };
  uniform Ripple u_ripples[8];
  uniform int u_ripple_count;

  // Idle Organic Parameters
  uniform float u_idle_speed;
  uniform float u_idle_amp;

  // Material & Craft Parameters
  uniform float u_chromatic_dispersion; // physical strain dispersion
  uniform float u_sheen;                // surface tension relief highlight
  uniform vec3 u_color_bg;              // background color
  uniform vec3 u_color_text;            // text color
  uniform vec3 u_color_accent;          // subtle tension tint

  void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = v_uv;
    vec2 p_aspect = vec2(v_uv.x * aspect, v_uv.y);

    // 1. Idle Restrained Organic Breathing
    float t_idle = u_time * u_idle_speed;
    vec2 idle_disp = vec2(
      sin(p_aspect.y * 3.8 + t_idle * 0.75) * 0.0025 + cos(p_aspect.x * 2.2 + t_idle * 0.55) * 0.0018,
      cos(p_aspect.x * 3.2 + t_idle * 0.85) * 0.0022 + sin(p_aspect.y * 2.6 + t_idle * 0.45) * 0.0016
    ) * u_idle_amp;

    // 2. Cursor Proximity / Viscoelastic Attraction
    vec2 hover_disp = vec2(0.0);
    if (u_pointer_active > 0.01) {
      vec2 ptr_aspect = vec2(u_pointer.x * aspect, u_pointer.y);
      float d_ptr = length(p_aspect - ptr_aspect);
      
      if (d_ptr < u_hover_radius) {
        // Smooth exponential-cubic falloff for soft magnetic feel
        float norm_d = d_ptr / u_hover_radius;
        float falloff = (1.0 - norm_d) * exp(-norm_d * 2.0);
        falloff = clamp(falloff, 0.0, 1.0) * u_pointer_active;

        vec2 to_ptr = (d_ptr > 0.0001) ? (ptr_aspect - p_aspect) / d_ptr : vec2(0.0);
        
        // Elastic pull towards cursor
        hover_disp += to_ptr * falloff * u_hover_strength;

        // Viscous wake from pointer velocity
        vec2 vel_aspect = vec2(u_pointer_vel.x * aspect, u_pointer_vel.y);
        hover_disp += vel_aspect * falloff * 0.18;
      }
    }

    // 3. Drag Interaction (Tensile Stretch & Damped Spring Recoil)
    vec2 drag_disp = vec2(0.0);
    if (u_drag_active > 0.01) {
      vec2 drag_origin_aspect = vec2(u_drag_origin.x * aspect, u_drag_origin.y);
      float d_drag = length(p_aspect - drag_origin_aspect);
      
      if (d_drag < u_drag_radius) {
        float norm_drag = d_drag / u_drag_radius;
        // Smooth bell curve falloff around grab origin
        float drag_weight = smoothstep(1.0, 0.0, norm_drag);
        drag_weight = pow(drag_weight, 1.6);
        
        drag_disp = u_drag_offset * drag_weight;
      }
    }

    // 4. Acoustic Wave Ripples (Harmonic Shockwaves)
    vec2 ripple_disp = vec2(0.0);
    for (int i = 0; i < 8; i++) {
      if (i >= u_ripple_count) break;
      
      float elapsed = u_time - u_ripples[i].startTime;
      if (elapsed > 0.0 && elapsed < u_ripples[i].duration) {
        vec2 rip_origin_aspect = vec2(u_ripples[i].origin.x * aspect, u_ripples[i].origin.y);
        float d_rip = length(p_aspect - rip_origin_aspect);
        float wave_front = elapsed * u_ripples[i].speed;
        float delta = d_rip - wave_front;

        // Gaussian packet envelope around wave crest
        float env = exp(-pow(delta / u_ripples[i].width, 2.0));
        // Exponential temporal decay
        float decay = exp(-elapsed * u_ripples[i].decay);

        float wave = sin(delta * u_ripples[i].frequency) * env * decay * u_ripples[i].amplitude;
        vec2 rip_dir = (d_rip > 0.0001) ? (p_aspect - rip_origin_aspect) / d_rip : vec2(0.0, 1.0);
        
        ripple_disp += rip_dir * wave;
      }
    }

    // Total displacement applied to texture coordinates (UV in normalized space)
    vec2 total_disp_aspect = idle_disp + hover_disp + drag_disp + ripple_disp;
    vec2 total_disp_uv = vec2(total_disp_aspect.x / aspect, total_disp_aspect.y);
    vec2 deformed_uv = v_uv - total_disp_uv;

    // Strain magnitude (physical tension)
    float strain = length(hover_disp + drag_disp + ripple_disp);

    // Physical Micro-Chromatic Dispersion on tensile strain
    float disp_offset = strain * u_chromatic_dispersion * 0.008;
    vec2 strain_dir = (strain > 0.0001) ? normalize(total_disp_uv) : vec2(0.0);

    float alpha_r = texture2D(u_texture, deformed_uv + strain_dir * disp_offset).a;
    float alpha_g = texture2D(u_texture, deformed_uv).a;
    float alpha_b = texture2D(u_texture, deformed_uv - strain_dir * disp_offset).a;
    float alpha_center = alpha_g;

    // Clamp boundary checks so texture doesn't wrap/bleed
    if (deformed_uv.x < 0.0 || deformed_uv.x > 1.0 || deformed_uv.y < 0.0 || deformed_uv.y > 1.0) {
      alpha_r = 0.0;
      alpha_g = 0.0;
      alpha_b = 0.0;
      alpha_center = 0.0;
    }

    // Surface Tension Micro-Sheen / Emboss Relief
    // Evaluates finite-difference normal along text boundary
    vec2 eps = vec2(1.0 / u_resolution.x, 1.0 / u_resolution.y) * 1.5;
    float a_right = texture2D(u_texture, deformed_uv + vec2(eps.x, 0.0)).a;
    float a_up    = texture2D(u_texture, deformed_uv + vec2(0.0, eps.y)).a;
    vec2 normal2d = vec2(alpha_center - a_right, alpha_center - a_up);
    
    // Top-left editorial light vector
    vec2 light_dir = normalize(vec2(-0.7, 0.7));
    float relief = clamp(dot(normal2d, light_dir) * 2.5, 0.0, 1.0) * strain * u_sheen;

    // Composite Colors
    // Background base
    vec3 base_color = u_color_bg;

    // Text color with subtle strain chromatic dispersion
    vec3 text_rgb = vec3(
      mix(u_color_bg.r, u_color_text.r, alpha_r),
      mix(u_color_bg.g, u_color_text.g, alpha_g),
      mix(u_color_bg.b, u_color_text.b, alpha_b)
    );

    // Add tactile relief sheen (soft highlight along stretched edges)
    text_rgb += u_color_accent * relief;

    // Final color blending
    float max_alpha = max(max(alpha_r, alpha_g), alpha_b);
    vec3 final_color = mix(base_color, text_rgb, max_alpha);

    gl_FragColor = vec4(final_color, 1.0);
  }
`;
