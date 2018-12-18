#version 410
#define M_PI 3.14159265358979323846
#define air 1.00
#define glass 2.500
#define BOUNCE 5

uniform mat4 mat_inverse;
uniform mat4 persp_inverse;
uniform sampler2D envMap;
uniform vec3 center;
uniform float radius;

//const vec4 camera_coord = vec4(0.0, 10.0, 5.0, 0.0);
//const vec3 light_coord = vec3(10.0, 10.0, 5.0);


uniform float roughness = 0.6;
const vec4 ambient_ref_coeff = vec4(0.2, 0.2, 0.20, 0.0);
const vec4 diffuse_ref_coeff = vec4(0.4, 0.4, 0.40, 0.0);
const vec4 specular_ref_coeff = vec4(01.0, 01.0, 01.0, 0.0);
//const vec4 vertColor = vec4(0,0,01,0);


uniform float lightIntensity;
uniform bool transparent;
uniform float shininess;
uniform float eta;

in vec4 position;

out vec4 fragColor;


struct Light {
    vec3 direction;
    vec3 normal;
    float fresnel;
    vec4 colour;

};




vec4 getColorFromEnvironment(in vec3 direction)
{
    float sphereRadius = length(direction);

    float lat = acos(direction.z/ sphereRadius); //theta
    float lon = atan(direction.y , direction.x); //phi

    vec2 coord = vec2(lon/(2*M_PI) +0.5, lat/M_PI);
    return vec4(texture2D(envMap,coord));
}








bool raySphereIntersect(in vec3 start, in vec3 direction, inout vec3 newPoint) {

    vec3 CP = start - center;
    float a = dot(direction, direction);
    float b = 2*dot(direction,CP);
    float c = dot(CP,CP) - (radius * radius);

    float disc = pow(b,2) - 4 * a * c; // determinant
    float t;


    if (disc > 0){
        float q;
        if (b < 0.0)
            q = (-b - sqrt(disc))/2.0;
        else
            q = (-b + sqrt(disc))/2.0;

        float t0 = q /a;
        float t1 = c / q;

        // make sure t0 is smaller than t1
        if (t0 > t1) {
            // if t0 is bigger than t1 swap them around
            float temp = t0;
            t0 = t1;
            t1 = temp;
        }

        // if t1 is less than zero, the object is in the ray's negative direction
        // and consequently the ray misses the sphere
        if (t1 < 0.0)
            return false;

        // if t0 is less than zero, the intersection point is at t1
        if (t0 < 0.0) {
            t = t1;
        } else {
            t = t0;
        }
    }

    else if(disc == 0){
        t = -0.5 * b/a;
    }

    else{
        return false;
    }

    newPoint = start + t * direction;
    return true;



}








// float difuse_light(in vec3 vertNormal, in vec3 lightVector) {
//     return  max(dot(normalize(vertNormal), normalize(lightVector)),0.0);
// }
//
// float specular_light(in vec3 vertNormal, in vec3 lightVector, in vec3 eyeVector)
// {
//     vec3 halfVector  = normalize(normalize(eyeVector) + normalize(lightVector));
//
//     float cos_angle = (dot(halfVector,lightVector))/(length(halfVector)*length(lightVector));
//
//     float ci = pow(eta*eta -1 + pow(cos_angle, 2), 0.5);
//
//     float Fs = pow((cos_angle - ci)/(cos_angle + ci),2);
//     float Fp = pow((eta* eta* cos_angle - ci)/(eta* eta* cos_angle + ci),2);
//
//     float Fresnel_coeff = 0.5*(Fs + Fp);
//
//     return Fresnel_coeff * pow(max(dot(normalize(vertNormal), halfVector),0.0),shininess);
//
//
// }








float fresnel (vec3 normal, vec3 light, float eta2)
{

    float f0 = pow((1-eta2)/(1+eta2),2);
    float ret = (f0+(1-f0)*(pow( 1- dot(normal, light)  ,5)));
    // return 1.04 - ret*(.04);
    return (eta + (1.0-eta) * ret);
}






void main(void)
{
    // Step 1: I need pixel coordinates. Division by w ?
    vec4 worldPos = position;
    worldPos.z = 1; // near clipping plane
    worldPos = persp_inverse * worldPos;
    worldPos /= worldPos.w;
    worldPos.w = 0;
    worldPos = normalize(worldPos);





    // Step 2: ray direction:
    vec3 u = normalize((mat_inverse * worldPos).xyz); // directions
    vec3 eye = (mat_inverse * vec4(0, 0, 0, 1)).xyz; // origin

    vec3 intersect_point;
    vec4 colour = vec4(0,0,0,1);

if(!transparent)
{

     if(raySphereIntersect(eye, u, intersect_point)){
        vec3 vertNormal = normalize(intersect_point - center);
        colour =  getColorFromEnvironment(normalize(reflect(u, vertNormal)));
        }
    else{

        colour =  getColorFromEnvironment(u) ;

        }
 }
 else  //refraction
 {

     if(raySphereIntersect(eye, u, intersect_point)){
         vec3 vertNormal = normalize(intersect_point - center);
         Light light[BOUNCE];
         for(int i = 1; i <BOUNCE; i++ ){ light[i].colour = vec4(0,0,0,0); light[i].fresnel = 0; }
         vec3 normal;
         vec3 direction;
         vec3 intersect_point2;


         light[0].fresnel = fresnel(vertNormal, u ,air/glass);
         light[0].normal =  normalize(intersect_point - center);
         light[0].direction = normalize(reflect(u, vertNormal));
         light[0].colour = getColorFromEnvironment(light[0].direction);

         direction = normalize(refract(u, vertNormal, air/glass));


         // raySphereIntersect(intersect_point +0.01*direction,direction, intersect_point2);
         //
         //     normal = normalize(center - intersect_point2);
         //
         //     int i = 1;
         //     light[i].direction = normalize(refract(direction, normal, glass/air));
         //     light[i+1].direction = normalize(reflect(direction, normal));
         //     light[i+1].fresnel = fresnel(normal, direction ,glass/air);
         //     light[i].fresnel = 1- light[i+1].fresnel ;
         //     direction = light[i+1].direction;
         //
         //
         //     light[i].colour = getColorFromEnvironment(light[i].direction);
         //     colour = (light[i].fresnel)*light[i].colour;
             //colour = (light[0].fresnel)*light[0].colour + (1-light[0].fresnel)*colour;







             // Calculate the direction of each ray and fresnel coefficient at each intersection point
         for(int i = 1; i < BOUNCE; i++ ){
             raySphereIntersect(intersect_point + direction*0.01,direction, intersect_point2); // addition of 0.01*direction so to shift our origin of ray so that we donot detect the same point of intersection.
             normal = normalize(center - intersect_point2);
             light[i].direction = normalize(refract(direction, normal, glass/air));
             light[i+1].direction = normalize(reflect(direction, normal));
             light[i+1].fresnel = fresnel(normal, direction ,glass/air);
             light[i].fresnel = 1- light[i+1].fresnel ;
             direction = light[i+1].direction;
             intersect_point = intersect_point2;
         }

         //calculate the colour by adding it from refracted and reflected rays
         for (int i=BOUNCE -1; i > 0; i--)
         {
           colour =  light[i].fresnel*getColorFromEnvironment(light[i].direction) + (1-light[i].fresnel)*colour;
         }


    }
    else{

        colour =  getColorFromEnvironment(u) ;


     }
 }

    fragColor = colour;
}
