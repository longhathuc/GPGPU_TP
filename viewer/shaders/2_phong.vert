#version 410

uniform mat4 matrix;        //model view matrix
uniform mat4 perspective;
uniform mat3 normalMatrix;
uniform bool noColor;
uniform vec3 lightPosition;

// World coordinates
in vec4 vertex;
in vec4 normal;
in vec4 color;

// Camera-space coordinates
out vec4 eyeVector;   //done
out vec4 lightVector; //done
out vec4 lightSpace; // placeholder for shadow mapping
out vec4 vertColor;
out vec4 vertNormal;

void main( void )
{
    if (noColor) vertColor = vec4(0.2, 0.6, 0.7, 1.0 );
    else vertColor = color;
    vertNormal.xyz = normalize(normalMatrix * normal.xyz);
    vertNormal.w = 0.0;

    // TODO: compute eyeVector, lightVector.
    vec4 eyePos  = vec4(0.0, 0.0, 0.0, 1.0);
    vec4 vertPos = matrix * vertex;

    eyeVector    = normalize(eyePos - vertPos);
    vec4 ligthPosition4 = vec4(lightPosition,1.0);
    lightVector  = normalize(ligthPosition4 - vertPos);

    mat4 normalMatrix4 = mat4(normalMatrix);
    vertNormal   = normalize(normalMatrix4 * normal);
    // end TODO
   // gl_Position = perspective * matrix * vertex;
   gl_Position = perspective * vertPos;

}
