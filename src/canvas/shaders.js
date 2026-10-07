export const VERTEX_SHADER_SOURCE = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = (a_position + 1.0) * 0.5;
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
  uniform int u_material_mode;

  uniform vec2 u_pointer;
  uniform vec2 u_pointer_vel;
  uniform float u_pointer_active;
  uniform float u_hover_radius;
  uniform float u_hover_strength;

  uniform vec2 u_drag_origin;
  uniform vec2 u_drag_offset;
  uniform float u_drag_radius;
  uniform float u_drag_active;

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

  uniform float u_idle_speed;
  uniform float u_idle_amp;

  uniform float u_chromatic_dispersion;
  uniform float u_sheen;
  uniform vec3 u_color_bg;
  uniform vec3 u_color_text;
  uniform vec3 u_color_accent;

  void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = v_uv;
    vec2 p_aspect = vec2(v_uv.x * aspect, v_uv.y);

    float t_idle = u_time * u_idle_speed;
    vec2 idle_disp = vec2(0.0);

    if (u_material_mode == 1) {
      float wave_a = sin(p_aspect.y * 7.0 + t_idle * 1.5) * cos(p_aspect.x * 5.5 + t_idle * 1.1);
      float wave_b = cos(p_aspect.x * 6.5 + t_idle * 1.3) * sin(p_aspect.y * 4.8 + t_idle * 0.9);
      idle_disp = vec2(wave_a, wave_b) * 0.006 * u_idle_amp;
    } else if (u_material_mode == 2) {
      float hum = sin(t_idle * 2.5) * 0.0009 * u_idle_amp;
      idle_disp = vec2(sin(p_aspect.y * 14.0) * hum, cos(p_aspect.x * 14.0) * hum);
    } else {
      idle_disp = vec2(
        sin(p_aspect.y * 3.8 + t_idle * 0.75) * 0.0025 + cos(p_aspect.x * 2.2 + t_idle * 0.55) * 0.0018,
        cos(p_aspect.x * 3.2 + t_idle * 0.85) * 0.0022 + sin(p_aspect.y * 2.6 + t_idle * 0.45) * 0.0016
      ) * u_idle_amp;
    }

    vec2 hover_disp = vec2(0.0);
    if (u_pointer_active > 0.01) {
      vec2 ptr_aspect = vec2(u_pointer.x * aspect, u_pointer.y);
      float d_ptr = length(p_aspect - ptr_aspect);
      
      if (d_ptr < u_hover_radius) {
        float norm_d = d_ptr / u_hover_radius;
        float falloff = (1.0 - norm_d) * exp(-norm_d * 2.0) * u_pointer_active;
        vec2 to_ptr = (d_ptr > 0.0001) ? (ptr_aspect - p_aspect) / d_ptr : vec2(0.0);
        vec2 vel_aspect = vec2(u_pointer_vel.x * aspect, u_pointer_vel.y);

        if (u_material_mode == 1) {
          vec2 vortex_curl = vec2(-to_ptr.y, to_ptr.x);
          float vel_mag = length(vel_aspect);
          hover_disp += to_ptr * falloff * u_hover_strength * 0.85;
          hover_disp += vortex_curl * falloff * (0.045 + vel_mag * 0.35);
          hover_disp += vel_aspect * falloff * 0.22;
        } else if (u_material_mode == 2) {
          hover_disp += to_ptr * falloff * u_hover_strength * 0.95;
          hover_disp += vel_aspect * falloff * 0.05;
        } else {
          hover_disp += to_ptr * falloff * u_hover_strength;
          hover_disp += vel_aspect * falloff * 0.10;
        }
      }
    }

    vec2 drag_disp = vec2(0.0);
    if (u_drag_active > 0.01) {
      vec2 drag_origin_aspect = vec2(u_drag_origin.x * aspect, u_drag_origin.y);
      float d_drag = length(p_aspect - drag_origin_aspect);
      
      if (d_drag < u_drag_radius) {
        float norm_drag = d_drag / u_drag_radius;
        float drag_weight = smoothstep(1.0, 0.0, norm_drag);
        drag_weight = pow(drag_weight, 1.6);
        
        drag_disp = u_drag_offset * drag_weight;

        if (u_material_mode == 1) {
          vec2 perp_drag = vec2(-u_drag_offset.y, u_drag_offset.x) * 0.3;
          drag_disp += perp_drag * sin(norm_drag * 3.1415) * 0.4;
        }
      }
    }

    vec2 ripple_disp = vec2(0.0);
    for (int i = 0; i < 8; i++) {
      if (i >= u_ripple_count) break;
      
      float elapsed = u_time - u_ripples[i].startTime;
      if (elapsed > 0.0 && elapsed < u_ripples[i].duration) {
        vec2 rip_origin_aspect = vec2(u_ripples[i].origin.x * aspect, u_ripples[i].origin.y);
        float d_rip = length(p_aspect - rip_origin_aspect);
        float wave_front = elapsed * u_ripples[i].speed;
        float delta = d_rip - wave_front;

        float env = exp(-pow(delta / u_ripples[i].width, 2.0));
        float decay = exp(-elapsed * u_ripples[i].decay);

        vec2 rip_dir = (d_rip > 0.0001) ? (p_aspect - rip_origin_aspect) / d_rip : vec2(0.0, 1.0);

        if (u_material_mode == 1) {
          float wave1 = sin(delta * u_ripples[i].frequency);
          float wave2 = sin(delta * u_ripples[i].frequency * 1.8 + elapsed * 2.5) * 0.35;
          float total_wave = (wave1 + wave2) * env * decay * u_ripples[i].amplitude * 1.25;
          vec2 liquid_curl = vec2(-rip_dir.y, rip_dir.x) * 0.2;
          ripple_disp += (rip_dir + liquid_curl) * total_wave;
        } else if (u_material_mode == 2) {
          float wave = sin(delta * u_ripples[i].frequency * 1.25) * env * decay * u_ripples[i].amplitude;
          ripple_disp += rip_dir * wave;
        } else {
          float wave = sin(delta * u_ripples[i].frequency) * env * decay * u_ripples[i].amplitude;
          ripple_disp += rip_dir * wave;
        }
      }
    }

    vec2 total_disp_aspect = idle_disp + hover_disp + drag_disp + ripple_disp;
    vec2 total_disp_uv = vec2(total_disp_aspect.x / aspect, total_disp_aspect.y);
    vec2 deformed_uv = v_uv - total_disp_uv;

    float strain = length(hover_disp + drag_disp + ripple_disp);
    float disp_offset = strain * u_chromatic_dispersion * 0.008;
    vec2 strain_dir = (strain > 0.0001) ? normalize(total_disp_uv) : vec2(0.0);

    float alpha_r = texture2D(u_texture, deformed_uv + strain_dir * disp_offset).a;
    float alpha_g = texture2D(u_texture, deformed_uv).a;
    float alpha_b = texture2D(u_texture, deformed_uv - strain_dir * disp_offset).a;
    float alpha_center = alpha_g;

    if (deformed_uv.x < 0.0 || deformed_uv.x > 1.0 || deformed_uv.y < 0.0 || deformed_uv.y > 1.0) {
      alpha_r = 0.0;
      alpha_g = 0.0;
      alpha_b = 0.0;
      alpha_center = 0.0;
    }

    vec2 eps = vec2(1.0 / u_resolution.x, 1.0 / u_resolution.y) * 1.5;
    float a_right = texture2D(u_texture, deformed_uv + vec2(eps.x, 0.0)).a;
    float a_up    = texture2D(u_texture, deformed_uv + vec2(0.0, eps.y)).a;
    vec2 normal2d = vec2(alpha_center - a_right, alpha_center - a_up);
    
    vec2 light_dir = normalize(vec2(-0.7, 0.7));
    float relief = clamp(dot(normal2d, light_dir) * 2.5, 0.0, 1.0) * strain * u_sheen;

    vec3 text_rgb = vec3(
      mix(u_color_bg.r, u_color_text.r, alpha_r),
      mix(u_color_bg.g, u_color_text.g, alpha_g),
      mix(u_color_bg.b, u_color_text.b, alpha_b)
    );

    float is_light = step(0.5, (u_color_bg.r + u_color_bg.g + u_color_bg.b) / 3.0);
    vec3 sheen_color = mix(u_color_accent, -u_color_accent * 0.4, is_light);
    text_rgb += sheen_color * relief;

    gl_FragColor = vec4(clamp(text_rgb, 0.0, 1.0), 1.0);
  }
`;
