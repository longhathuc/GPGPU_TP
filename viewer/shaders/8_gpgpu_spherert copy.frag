#version 410

uniform mat4 mat_inverse;
uniform mat4 persp_inverse;
uniform sampler2D envMap;
uniform vec3 center;
uniform float radius;

uniform bool transparent;
uniform bool bubble;
uniform float shininess;
uniform float eta;

float roughness = 1.0/shininess;

in vec4 position;

out vec4 fragColor;

const float PI  = 3.1415926535897932384626433832795;
const int iBounce = 5;



vec3  lightDirection[iBounce];
vec3  lightNormal[iBounce];
float lightFresnel[iBounce];
vec4  lightColour[iBounce];
const float bubbleSphereDiameterRatio = 0.999;


vec4 getColorFromEnvironment(in vec3 direction);
bool raySphereIntersect(in vec3 start, in vec3 direction, out vec3 newPoint,float radiusSphere);
float fresnel (vec3 normal, vec3 light, float eta2);

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

    if (bubble)
    {
        colour =  getColorFromEnvironment(u) ;
        if(raySphereIntersect(eye, u, intersect_point,radius)){


                 vec3 vertNormal = normalize(intersect_point - center);
                 for(int i = 1; i <iBounce; i++ )
                 {
                     lightColour[i] = vec4(0,0,0,0);
                     lightFresnel[i] = 0;
                 }
                 vec3 normal;
                 vec3 direction;

                 vec3 intersectPointInnerBubble;
                 vec3 intersectPointInnerBubble2;

                 lightFresnel[0] = fresnel(vertNormal, u ,eta);
                 lightNormal[0] =  vertNormal;
                 lightDirection[0] = normalize(reflect(u, vertNormal));
                 lightColour[0] = getColorFromEnvironment(lightDirection[0]);

                 //light enter sphere
                 direction = normalize(refract(u, vertNormal, eta));

                 //new direction according to the inner radius
                 //reduce the length of the radius
                float radiusInner = bubbleSphereDiameterRatio * radius;

                //find the intersect point from outer bubble with inner
                raySphereIntersect(intersect_point, direction, intersectPointInnerBubble,radiusInner);



                //int i = 1;
                     // Calculate the direction of each ray and fresnel coefficient at each intersection point
               for(int i = 1; i < iBounce; i++ ){

                    // addition of 0.01*direction so to shift our origin of ray so that we donot detect the same point of intersection.

//                    //reflect from inner sphere
//                    normal = normalize(intersectPointInnerBubble - center);
//                    lightDirection[i+1] = normalize(reflect(direction, normal));
//                    lightFresnel[i+1]   = fresnel(normal, direction,1/eta);
//                    lightColour[i+1] = getColorFromEnvironment(lightDirection[i+1]);


//                    //refract to environment
//                   //normal = normalize(center - intersectPointInnerBubble2);
//                    lightFresnel[i] = 1- lightFresnel[i+1];
//                    lightDirection[i] = normalize(refract(direction, normal, 1/eta));
//                    lightColour[i] = getColorFromEnvironment(lightDirection[i]);


                    //refract to inner the air sphere
                    raySphereIntersect(intersectPointInnerBubble + direction*0.001,direction, intersectPointInnerBubble2,radiusInner);
                    normal = normalize(intersectPointInnerBubble2-center);
                    intersectPointInnerBubble = intersectPointInnerBubble;
                    lightFresnel[i] = fresnel(normal, direction ,1/eta);
                    lightDirection[i] = normalize(refract(direction, normal, 1/eta));
                    lightColour[i] = getColorFromEnvironment(lightDirection[i]);
                    direction = lightDirection[i];
                    //intersect_point = intersectPointInnerBubble2;

//                     //reflect inner sphere
//                    raySphereIntersect(intersectPointInnerBubble + direction*0.001,direction, intersectPointInnerBubble2,radiusInner);
//                    normal = normalize(center - intersectPointInnerBubble2);
//                    lightDirection[i+2] = normalize(reflect(direction, normal));
//                    lightFresnel[i+2]   = fresnel(normal, direction ,eta);
//                    lightColour[i+2] = getColorFromEnvironment(lightDirection[i+2]);


//                    refract to outer sphere again
                      raySphereIntersect(intersectPointInnerBubble + direction*0.001,direction, intersectPointInnerBubble2,radiusInner);
                      normal = normalize(center - intersectPointInnerBubble2);
                      lightFresnel[i] = fresnel(normal, direction ,eta);
                      lightDirection[i] = normalize(refract(direction, normal, eta));
                      lightColour[i] = getColorFromEnvironment(lightDirection[i]);
                      intersectPointInnerBubble = intersectPointInnerBubble2;
                      direction = lightDirection[i];


//                    //reflect outer sphere
//                   raySphereIntersect(intersectPointInnerBubble + direction*0.001,direction, intersect_point,radius);
//                   normal = normalize(center - intersect_point);
//                   lightDirection[i+3] = normalize(reflect(direction, normal));
//                   lightFresnel[i+3]   = fresnel(normal, direction ,1/eta);
//                   lightColour[i+3] = getColorFromEnvironment(lightDirection[i+3]);



//                    //refract to environment
                      raySphereIntersect(intersectPointInnerBubble + direction*0.001,direction, intersect_point,radius);
                      normal = normalize(intersectPointInnerBubble - intersect_point);
                      lightFresnel[i] = fresnel(normal, direction ,1/eta);
                      lightDirection[i] = normalize(refract(direction, normal, 1/eta));
                      lightColour[i] = getColorFromEnvironment(lightDirection[i]);
                      direction = lightDirection[i];


                    direction = lightDirection[i];
                    //intersectPointInnerBubble = intersectPointInnerBubble2;
               }
               for (int i = iBounce - 1; i > 0; i--)
                 colour =  lightFresnel[i]*getColorFromEnvironment(lightDirection[i]) + (1-lightFresnel[i])* lightColour[i];
              // colour =  lightFresnel[1]*getColorFromEnvironment(lightDirection[1]) + (1-lightFresnel[1])* lightColour[1];

        }
        else{
            colour =  getColorFromEnvironment(u) ;

         }

    }
    else{


        if(!transparent)
        {
            //opaque, metal effect
             if(raySphereIntersect(eye, u, intersect_point,radius))
             {
                vec3 vertNormal = normalize(intersect_point - center);
                //total reflect
                colour =  getColorFromEnvironment(normalize(reflect(u, vertNormal)));
             }
             else
                colour =  getColorFromEnvironment(u) ;

         }
         else  //refraction & reflection
         {

            if(raySphereIntersect(eye, u, intersect_point,radius)){


                     vec3 vertNormal = normalize(intersect_point - center);
                     for(int i = 1; i <iBounce; i++ )
                     {
                         lightColour[i] = vec4(0,0,0,0);
                         lightFresnel[i] = 0;
                     }
                     vec3 normal;
                     vec3 direction;
                     vec3 intersect_point2;


                     lightFresnel[0] = fresnel(vertNormal, u ,eta);
                     lightNormal[0] =  vertNormal;
                     lightDirection[0] = normalize(reflect(u, vertNormal));
                     lightColour[0] = getColorFromEnvironment(lightDirection[0]);

                     //light enter spherex
                     direction = normalize(refract(u, vertNormal, eta));



                         // Calculate the direction of each ray and fresnel coefficient at each intersection point
                     for(int i = 1; i < iBounce; i++ ){
                         raySphereIntersect(intersect_point + direction*0.001,direction, intersect_point2,radius);
                         // addition of 0.01*direction so to shift our origin of ray so that we donot detect the same point of intersection.

                         normal = normalize(center - intersect_point2);
                         //reflect inside the sphere, follow this bouncing ray
                         lightDirection[i+1] = normalize(reflect(direction, normal));
                         lightFresnel[i+1]   = fresnel(normal, direction ,1/eta);
                         lightColour[i+1] = getColorFromEnvironment(lightDirection[i+1]);

                         //refract to ouside the sphere, the color the eye see
                         lightFresnel[i] = 1- lightFresnel[i+1] ;
                         lightDirection[i] = normalize(refract(direction, normal, 1/eta));
                         lightColour[i] = getColorFromEnvironment(lightDirection[i]);

                         direction = lightDirection[i+1];
                         intersect_point = intersect_point2;

                     }

                 colour =  lightFresnel[4]*getColorFromEnvironment(lightDirection[4]) + (1-lightFresnel[4]) * lightColour[4];

                 //Mix reflected and refracted light according to the  Fresnel factor
//                 for (int i = iBounce - 1; i > 0; i--)
//                   colour =  lightFresnel[i]*getColorFromEnvironment(lightDirection[i]) + (1-lightFresnel[i]) * lightColour[i];

            }
            else{
                colour =  getColorFromEnvironment(u) ;

             }
         }
     }

     fragColor = colour;
}


vec4 getColorFromEnvironment(in vec3 direction)
{
    float sphereRadius = length(direction);
    float lat = acos(direction.z/ sphereRadius); //theta
    float lon = atan(direction.y , direction.x); //phi
    vec2 coord = vec2(lon/(2.0*PI) +0.5, lat/PI);
    return vec4(texture(envMap,coord));
}

float fresnel(vec3 normal, vec3 light, float eta2)
{
    float cosTheta = dot(normal, light);
    float r0 = (1 - eta2) / (1 + eta2);
    r0 = r0 * r0;
    return r0 + (1 - r0) * pow((1 - cosTheta), 5);
}

//float fresnel(float eta, float cosTheta)
//{
//    float F0 = pow((1.0-eta),2.0) / pow((1.0+eta),2.0);
//    float minusCosTheta = 1.0 - cosTheta;
//    return F0 + (1.0 - F0)*pow(minusCosTheta,5.0);
//}


bool raySphereIntersect(in vec3 start, in vec3 direction, out vec3 newPoint, float radiusSphere) {

    vec3 CP = start - center;
    float a = dot(direction, direction);
    float b = 2*dot(direction,CP);

    float c = dot(CP,CP) - (radiusSphere * radiusSphere);

    float disc = pow(b,2) - 4 * a * c; // determinant
    float t;


    if (disc > 0){
        float q;
        if (b < 0.0)
            q = (-b - sqrt(disc))/2.0;
        else
            q = (-b + sqrt(disc))/2.0;

        float t0 = q /a;
        float t1 = c /q;

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
        if (t0 < 0.0)
            t = t1;
        else
            t = t0;

    }

    else
        //also ignore the tangent case
        return false;


    newPoint = start + t * direction;
    return true;



}

