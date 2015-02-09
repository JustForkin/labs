V.Terrain = {
uniforms: 
THREE.UniformsUtils.merge( [ THREE.UniformsLib[ 'fog' ], THREE.UniformsLib[ 'lights' ], THREE.UniformsLib[ 'shadowmap' ],{
'tCube' : { type: 't', value: null },
'enableReflection': { type: 'i', value: 0 },
'useRefract' : { type: 'i', value: 0 },
'reflectivity' : { type: 'f', value: 1.0 },
'refractionRatio' : { type: 'f', value: 0.98 },
'combine' : { type: 'i', value: 0 },

'oceanTexture'  : { type: 't', value: null },
'sandyTexture'  : { type: 't', value: null },
'grassTexture'  : { type: 't', value: null },
'rockyTexture'  : { type: 't', value: null },
'snowyTexture'  : { type: 't', value: null },

'enableDiffuse1'  : { type: 'i', value: 0 },
'enableDiffuse2'  : { type: 'i', value: 0 },
'enableSpecular'  : { type: 'i', value: 0 },
'enableReflection': { type: 'i', value: 0 },

'tDiffuse1'    : { type: 't', value: null },
'tDiffuse2'    : { type: 't', value: null },
'tDetail'      : { type: 't', value: null },
'tNormal'      : { type: 't', value: null },
'tSpecular'    : { type: 't', value: null },
'tDisplacement': { type: 't', value: null },

'uNormalScale': { type: 'f', value: 1.0 },

'uDisplacementBias': { type: 'f', value: 0.0 },
'uDisplacementScale': { type: 'f', value: 1.0 },

'diffuse': { type: 'c', value: new THREE.Color( 0xeeeeee ) },
'specular': { type: 'c', value: new THREE.Color( 0x111111 ) },
'ambient': { type: 'c', value: new THREE.Color( 0x050505 ) },
'shininess': { type: 'f', value: 30 },
'opacity': { type: 'f', value: 1 },

//'vAmount': { type: 'f', value: 30 },

'uRepeatBase'    : { type: 'v2', value: new THREE.Vector2( 1, 1 ) },
'uRepeatOverlay' : { type: 'v2', value: new THREE.Vector2( 1, 1 ) },

'uOffset' : { type: 'v2', value: new THREE.Vector2( 0, 0 ) }
}]),
fs: [
'uniform sampler2D oceanTexture;',
'uniform sampler2D sandyTexture;',
'uniform sampler2D grassTexture;',
'uniform sampler2D rockyTexture;',
'uniform sampler2D snowyTexture;',

'uniform sampler2D fullTexture;',

'uniform samplerCube tCube;',
'uniform bool useRefract;',
'uniform float refractionRatio;',
'uniform float reflectivity;',
'uniform bool enableReflection;',

'varying float vAmount;',

'uniform vec3 ambient;',
'uniform vec3 diffuse;',
'uniform vec3 specular;',
'uniform float shininess;',
'uniform float opacity;',

'uniform bool enableDiffuse1;',
'uniform bool enableDiffuse2;',
'uniform bool enableSpecular;',

'uniform sampler2D tDiffuse1;',
'uniform sampler2D tDiffuse2;',
'uniform sampler2D tDetail;',
'uniform sampler2D tNormal;',
'uniform sampler2D tSpecular;',
'uniform sampler2D tDisplacement;',

'uniform float uNormalScale;',

'uniform vec2 uRepeatOverlay;',
'uniform vec2 uRepeatBase;',

'uniform vec2 uOffset;',

'varying vec3 vTangent;',
'varying vec3 vBinormal;',
'varying vec3 vNormal;',
'varying vec2 vUv;',

'uniform vec3 ambientLightColor;',

'#if MAX_DIR_LIGHTS > 0',

    'uniform vec3 directionalLightColor[ MAX_DIR_LIGHTS ];',
    'uniform vec3 directionalLightDirection[ MAX_DIR_LIGHTS ];',

'#endif',

'#if MAX_HEMI_LIGHTS > 0',

    'uniform vec3 hemisphereLightSkyColor[ MAX_HEMI_LIGHTS ];',
    'uniform vec3 hemisphereLightGroundColor[ MAX_HEMI_LIGHTS ];',
    'uniform vec3 hemisphereLightDirection[ MAX_HEMI_LIGHTS ];',

'#endif',

'#if MAX_POINT_LIGHTS > 0',

    'uniform vec3 pointLightColor[ MAX_POINT_LIGHTS ];',
    'uniform vec3 pointLightPosition[ MAX_POINT_LIGHTS ];',
    'uniform float pointLightDistance[ MAX_POINT_LIGHTS ];',

'#endif',

'varying vec3 vViewPosition;',
'varying vec3 vWorldPosition;',

THREE.ShaderChunk[ 'shadowmap_pars_fragment' ],
//THREE.ShaderChunk[ 'envmap_pars_fragment' ],
THREE.ShaderChunk[ 'fog_pars_fragment' ],

'void main() {',

    'vec2 uvOverlay = uRepeatOverlay * vUv + uOffset;',
    'vec2 uvBase = uRepeatBase * vUv;',

    'vec4 water = (smoothstep(0.01, 0.20, vAmount) - smoothstep(0.24, 0.26, vAmount)) * texture2D( oceanTexture, uvOverlay );',
    'vec4 sandy = (smoothstep(0.10, 0.27, vAmount) - smoothstep(0.28, 0.31, vAmount)) * texture2D( sandyTexture, uvOverlay );', //vec2( 20,20 ) * vUv + uOffset
    'vec4 grass = (smoothstep(0.28, 0.40, vAmount) - smoothstep(0.35, 0.40, vAmount)) * texture2D( grassTexture, uvOverlay );',
    'vec4 rocky = (smoothstep(0.30, 0.76, vAmount) - smoothstep(0.40, 0.70, vAmount)) * texture2D( rockyTexture, uvOverlay );',
    'vec4 snowy = (smoothstep(0.80, 0.99, vAmount))                                   * texture2D( snowyTexture, uvOverlay );',

    'gl_FragColor = vec4( vec3( 1.0 ), opacity );',

    'vec3 specularTex = vec3( 1.0 );',

    

    'vec3 normalTex = texture2D( tDetail, uvOverlay ).xyz * 2.0 - 1.0;',
    'normalTex.xy *= uNormalScale;',
    'normalTex = normalize( normalTex );',

    

    'if( enableDiffuse1 && enableDiffuse2 ) {',

        'vec4 colDiffuse1 = texture2D( tDiffuse1, uvOverlay );',
        'vec4 colDiffuse2 = texture2D( tDiffuse2, uvOverlay );',

        '#ifdef GAMMA_INPUT',

            'colDiffuse1.xyz *= colDiffuse1.xyz;',
            'colDiffuse2.xyz *= colDiffuse2.xyz;',

        '#endif',

        'gl_FragColor = gl_FragColor * mix ( colDiffuse1, colDiffuse2, 1.0 - texture2D( tDisplacement, uvBase ) );',
        //'gl_FragColor = gl_FragColor * mix ( colDiffuse1, colDiffuse2, 1.0 - texture2D( tDisplacement, uvBase ) )+ water + sandy + grass + rocky + snowy;',
        'gl_FragColor = vec4( gl_FragColor.xyz, 1.0 )+ water + sandy + grass + rocky + snowy;',
        //'fullTexture = vec4( gl_FragColor.xyz, 1.0 )+ water + sandy + grass + rocky + snowy;',
        //'gl_FragColor.xyz = mix( gl_FragColor.xyz, fullTexture, 1.0 );',


    ' } else if( enableDiffuse1 ) {',

        'gl_FragColor = gl_FragColor * texture2D( tDiffuse1, uvOverlay );',
        //'gl_FragColor = gl_FragColor * texture2D( tDiffuse1, uvOverlay ) + water + sandy + grass + rocky + snowy;',
        //'gl_FragColor = gl_FragColor * mix ( tDiffuse1, water + sandy + grass + rocky + snowy, 1.0 - texture2D( tDisplacement, uvBase ) );',

    '} else if( enableDiffuse2 ) {',

        'gl_FragColor = gl_FragColor * texture2D( tDiffuse2, uvOverlay );',

    '}',

    'if( enableSpecular )',
        'specularTex = texture2D( tSpecular, uvOverlay ).xyz;',

    'mat3 tsb = mat3( vTangent, vBinormal, vNormal );',
    'vec3 finalNormal = tsb * normalTex;',

    'vec3 normal = normalize( finalNormal );',
    'vec3 viewPosition = normalize( vViewPosition );',

    // point lights

    '#if MAX_POINT_LIGHTS > 0',

        'vec3 pointDiffuse = vec3( 0.0 );',
        'vec3 pointSpecular = vec3( 0.0 );',

        'for ( int i = 0; i < MAX_POINT_LIGHTS; i ++ ) {',

            'vec4 lPosition = viewMatrix * vec4( pointLightPosition[ i ], 1.0 );',
            'vec3 lVector = lPosition.xyz + vViewPosition.xyz;',

            'float lDistance = 1.0;',
            'if ( pointLightDistance[ i ] > 0.0 )',
                'lDistance = 1.0 - min( ( length( lVector ) / pointLightDistance[ i ] ), 1.0 );',

            'lVector = normalize( lVector );',

            'vec3 pointHalfVector = normalize( lVector + viewPosition );',
            'float pointDistance = lDistance;',

            'float pointDotNormalHalf = max( dot( normal, pointHalfVector ), 0.0 );',
            'float pointDiffuseWeight = max( dot( normal, lVector ), 0.0 );',

            'float pointSpecularWeight = specularTex.r * max( pow( pointDotNormalHalf, shininess ), 0.0 );',

            'pointDiffuse += pointDistance * pointLightColor[ i ] * diffuse * pointDiffuseWeight;',
            'pointSpecular += pointDistance * pointLightColor[ i ] * specular * pointSpecularWeight * pointDiffuseWeight;',

        '}',

    '#endif',

    // directional lights

    '#if MAX_DIR_LIGHTS > 0',

        'vec3 dirDiffuse = vec3( 0.0 );',
        'vec3 dirSpecular = vec3( 0.0 );',

        'for( int i = 0; i < MAX_DIR_LIGHTS; i++ ) {',

            'vec4 lDirection = viewMatrix * vec4( directionalLightDirection[ i ], 0.0 );',

            'vec3 dirVector = normalize( lDirection.xyz );',
            'vec3 dirHalfVector = normalize( dirVector + viewPosition );',

            'float dirDotNormalHalf = max( dot( normal, dirHalfVector ), 0.0 );',
            'float dirDiffuseWeight = max( dot( normal, dirVector ), 0.0 );',

            'float dirSpecularWeight = specularTex.r * max( pow( dirDotNormalHalf, shininess ), 0.0 );',

            'dirDiffuse += directionalLightColor[ i ] * diffuse * dirDiffuseWeight;',
            'dirSpecular += directionalLightColor[ i ] * specular * dirSpecularWeight * dirDiffuseWeight;',

        '}',

    '#endif',

    // hemisphere lights

    '#if MAX_HEMI_LIGHTS > 0',

        'vec3 hemiDiffuse  = vec3( 0.0 );',
        'vec3 hemiSpecular = vec3( 0.0 );' ,

        'for( int i = 0; i < MAX_HEMI_LIGHTS; i ++ ) {',

            'vec4 lDirection = viewMatrix * vec4( hemisphereLightDirection[ i ], 0.0 );',
            'vec3 lVector = normalize( lDirection.xyz );',

            // diffuse

            'float dotProduct = dot( normal, lVector );',
            'float hemiDiffuseWeight = 0.5 * dotProduct + 0.5;',

            'hemiDiffuse += diffuse * mix( hemisphereLightGroundColor[ i ], hemisphereLightSkyColor[ i ], hemiDiffuseWeight );',

            // specular (sky light)

            'float hemiSpecularWeight = 0.0;',

            'vec3 hemiHalfVectorSky = normalize( lVector + viewPosition );',
            'float hemiDotNormalHalfSky = 0.5 * dot( normal, hemiHalfVectorSky ) + 0.5;',
            'hemiSpecularWeight += specularTex.r * max( pow( hemiDotNormalHalfSky, shininess ), 0.0 );',

            // specular (ground light)

            'vec3 lVectorGround = -lVector;',

            'vec3 hemiHalfVectorGround = normalize( lVectorGround + viewPosition );',
            'float hemiDotNormalHalfGround = 0.5 * dot( normal, hemiHalfVectorGround ) + 0.5;',
            'hemiSpecularWeight += specularTex.r * max( pow( hemiDotNormalHalfGround, shininess ), 0.0 );',

            'hemiSpecular += specular * mix( hemisphereLightGroundColor[ i ], hemisphereLightSkyColor[ i ], hemiDiffuseWeight ) * hemiSpecularWeight * hemiDiffuseWeight;',

        '}',

    '#endif',

    // all lights contribution summation

    'vec3 totalDiffuse = vec3( 0.0 );',
    'vec3 totalSpecular = vec3( 0.0 );',

    '#if MAX_DIR_LIGHTS > 0',

        'totalDiffuse += dirDiffuse;',
        'totalSpecular += dirSpecular;',

    '#endif',

    '#if MAX_HEMI_LIGHTS > 0',

        'totalDiffuse += hemiDiffuse;',
        'totalSpecular += hemiSpecular;',

    '#endif',

    '#if MAX_POINT_LIGHTS > 0',

        'totalDiffuse += pointDiffuse;',
        'totalSpecular += pointSpecular;',

    '#endif',


    //'gl_FragColor.xyz = gl_FragColor.xyz * ( totalDiffuse + ambientLightColor * ambient + totalSpecular );',

    // reflection test

    'if ( enableReflection ) {',

        'vec3 vReflect;',
        //'vec3 cameraToVertex = normalize( vWorldPosition - cameraPosition );',
        'vec3 cameraToVertex = normalize( vViewPosition - cameraPosition );',

        'if ( useRefract ) {',

            'vReflect = refract( cameraToVertex, normal, refractionRatio );',

        '} else {',

            'vReflect = reflect( cameraToVertex, normal );',

        '}',

        'vec4 cubeColor = textureCube( tCube, vec3( -vReflect.x, vReflect.yz ) );',

        '#ifdef GAMMA_INPUT',

            'cubeColor.xyz *= cubeColor.xyz;',

        '#endif',

        'gl_FragColor.xyz = mix( gl_FragColor.xyz, cubeColor.xyz, specularTex.r * reflectivity );',

    '}',


    /*'vec4 water = (smoothstep(0.01, 0.25, vAmount) - smoothstep(0.24, 0.26, vAmount)) * texture2D( oceanTexture, vUv * 20.0 );',
    'vec4 sandy = (smoothstep(0.24, 0.27, vAmount) - smoothstep(0.28, 0.31, vAmount)) * texture2D( sandyTexture, vUv * 20.0 );',
    'vec4 grass = (smoothstep(0.28, 0.32, vAmount) - smoothstep(0.35, 0.40, vAmount)) * texture2D( grassTexture, vUv * 20.0 );',
    'vec4 rocky = (smoothstep(0.30, 0.50, vAmount) - smoothstep(0.40, 0.70, vAmount)) * texture2D( rockyTexture, vUv * 20.0 );',
    'vec4 snowy = (smoothstep(0.50, 0.65, vAmount))                                   * texture2D( snowyTexture, vUv * 20.0 );',*/

    //'vec2 uvOverlay = uRepeatOverlay * vUv + uOffset;',

    /*'vec4 water = (smoothstep(0.01, 0.25, vAmount) - smoothstep(0.24, 0.26, vAmount)) * texture2D( oceanTexture, uvOverlay );',
    'vec4 sandy = (smoothstep(0.24, 0.27, vAmount) - smoothstep(0.28, 0.31, vAmount)) * texture2D( sandyTexture, uvOverlay );', //vec2( 20,20 ) * vUv + uOffset
    'vec4 grass = (smoothstep(0.28, 0.32, vAmount) - smoothstep(0.35, 0.40, vAmount)) * texture2D( grassTexture, uvOverlay );',
    'vec4 rocky = (smoothstep(0.30, 0.50, vAmount) - smoothstep(0.40, 0.70, vAmount)) * texture2D( rockyTexture, uvOverlay );',
    'vec4 snowy = (smoothstep(0.50, 0.65, vAmount))                                   * texture2D( snowyTexture, uvOverlay );',*/

    //'gl_FragColor.xyz = gl_FragColor.xyz * ( totalDiffuse + ambientLightColor * ambient) + totalSpecular;',
    
    //'gl_FragColor.xyz = mix( gl_FragColor.xyz, cubeColor.xyz, totalSpecular * reflectivity );',
    //'gl_FragColor.xyz = gl_FragColor.xyz * ( totalDiffuse + ambientLightColor * ambient + totalSpecular );',
    //'vec4 finalTex       = (totalDiffuse + ambientLightColor * ambient + totalSpecular);',
    //'gl_FragColor = vec4( gl_FragColor.xyz, 1.0 )+ water + sandy + grass + rocky + snowy;',
    //'gl_FragColor.xyz = gl_FragColor.xyz * ( totalDiffuse + ambientLightColor * ambient + totalSpecular );',

    THREE.ShaderChunk[ 'shadowmap_fragment' ],
    THREE.ShaderChunk[ 'linear_to_gamma_fragment' ],
    //THREE.ShaderChunk[ 'envmap_fragment' ],
    THREE.ShaderChunk[ 'fog_fragment' ],



'}'

].join('\n'),
vs:[
'varying float vAmount;',
'attribute vec4 tangent;',
'uniform vec2 uRepeatBase;',
'uniform sampler2D tNormal;',

'#ifdef VERTEX_TEXTURES',

    'uniform sampler2D tDisplacement;',
    'uniform float uDisplacementScale;',
    'uniform float uDisplacementBias;',

'#endif',

'varying vec3 vTangent;',
'varying vec3 vBinormal;',
'varying vec3 vNormal;',
'varying vec2 vUv;',

'varying vec3 vViewPosition;',
'varying vec3 vWorldPosition;',

THREE.ShaderChunk[ 'shadowmap_pars_vertex' ],
//THREE.ShaderChunk[ 'envmap_pars_vertex' ],

'void main() {',

    'vNormal = normalize( normalMatrix * normal );',

    // tangent and binormal vectors

    'vTangent = normalize( normalMatrix * tangent.xyz );',

    'vBinormal = cross( vNormal, vTangent ) * tangent.w;',
    'vBinormal = normalize( vBinormal );',

    // texture coordinates

    'vUv = uv;',
    'vec4 bumpData = texture2D( tDisplacement, uv );',
    'vAmount = bumpData.r;',

    'vec2 uvBase = uv * uRepeatBase;',

    // displacement mapping

    '#ifdef VERTEX_TEXTURES',

        'vec3 dv = texture2D( tDisplacement, uvBase ).xyz;',
        'float df = uDisplacementScale * dv.x + uDisplacementBias;',
        'vec3 displacedPosition = normal * df + position;',

        'vec4 worldPosition = modelMatrix * vec4( displacedPosition, 1.0 );',
        'vec4 mvPosition = modelViewMatrix * vec4( displacedPosition, 1.0 );',

    '#else',

        'vec4 worldPosition = modelMatrix * vec4( position, 1.0 );',
        'vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',

    '#endif',


    'gl_Position = projectionMatrix * mvPosition;',

    'vWorldPosition = worldPosition.xyz;',
    'vViewPosition = -mvPosition.xyz;',

    'vec3 normalTex = texture2D( tNormal, uvBase ).xyz * 2.0 - 1.0;',
    'vNormal = normalMatrix * normalTex;',

    //THREE.ShaderChunk[ 'worldpos_vertex' ],
    //THREE.ShaderChunk[ 'envmap_vertex' ],
    THREE.ShaderChunk[ 'shadowmap_vertex' ],
'}'
].join('\n')
}