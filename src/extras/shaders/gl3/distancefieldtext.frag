#version 150 core

uniform sampler2D distanceFieldTexture;
uniform float minAlpha;
uniform float maxAlpha;
uniform float textureSize;
uniform vec4 color;
// LDG BEGIN
uniform float outlineWidth;
// LDG END

in vec2 texCoord;
in float zValue;

out vec4 fragColor;


// LDG BEGIN
vec2 Outline(float distValue, float outlineWidth, float edgeAlpha)
{
    float halfOutlineWidth = outlineWidth * 0.5;
    float outer = edgeAlpha - halfOutlineWidth;
    float inner = edgeAlpha + halfOutlineWidth;

    if (distValue < edgeAlpha) {
        float f = smoothstep(outer, edgeAlpha, distValue);
        return vec2(1, f);
    }
    float f = 1 - smoothstep(edgeAlpha, inner, distValue);
    return vec2(f, 1) ;
}
// LDG END



void main()
{
    // determine the scale of the glyph texture within pixel-space coordinates
    // (that is, how many pixels are drawn for each texel)
    vec2 texelDeltaX = abs(dFdx(texCoord));
    vec2 texelDeltaY = abs(dFdy(texCoord));
    float avgTexelDelta = textureSize * 0.5 * (texelDeltaX.x + texelDeltaX.y + texelDeltaY.x + texelDeltaY.y);
    float texScale = 1.0 / avgTexelDelta;

    // scaled to interval [0.0, 0.15]
    float devScaleMin = 0.00;
    float devScaleMax = 0.15;
    float scaled = (clamp(texScale, devScaleMin, devScaleMax) - devScaleMin) / (devScaleMax - devScaleMin);

    // thickness of glyphs should increase a lot for very small glyphs to make them readable
    float base = 0.5;
    float threshold = base * scaled;
    float range = 0.06 / texScale;

    float minAlpha = threshold - range;
    float maxAlpha = threshold + range;

    float distVal = texture(distanceFieldTexture, texCoord).r;


    vec4 final = vec4(color.rgb, color.a * smoothstep(minAlpha, maxAlpha, distVal));

    // LDG BEGIN
    // Outline
    vec2 outline = Outline(distVal, outlineWidth, minAlpha);
    final.rgb = mix(final.rgb, vec3(0, 0, 0), outline.x);
    final.a = mix(final.a, outline.y, outline.x);
    fragColor = final;
    // LDG END

    gl_FragDepth = gl_FragCoord.z - zValue * 0.00001;
}
