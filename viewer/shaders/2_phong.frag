#version 410

uniform float lightIntensity;
uniform bool blinnPhong;
uniform float shininess;
uniform float eta;
uniform sampler2D shadowMap;

in vec4 eyeVector;
in vec4 lightVector;
in vec4 vertColor;
in vec4 vertNormal;
in vec4 lightSpace;

out vec4 fragColor;

const float PI = 3.1415926535897932384626433832795;

// Schlick approximation
// using cosTheta directly to prevent inverse function
float fresnel(float eta, float cosTheta)
{
    float F0 = pow((1.0-eta),2.0) / pow((1.0+eta),2.0);
    float minusCosTheta = 1.0 - cosTheta;
    return F0 + (1.0 - F0)*pow(minusCosTheta,5.0);
}

//Fresn formular from TP page
float fresnel2(float eta, float cosTheta)
{
    float Ci = sqrt(pow(eta,2.0)-(1-pow(cosTheta,2.0)));
    float Fs = pow(abs((cosTheta-Ci)/(cosTheta+Ci)),2.0);
    float Fp = pow(abs((pow(eta,2.0)*cosTheta-Ci)/(pow(eta,2.0)*cosTheta+Ci)),2.0);
    return 0.5*(Fs+Fp);
}


float indicatorX(float cosTheta)
{
    if (cosTheta >= 0 && cosTheta <= 1)
        return 1.0;
    else return 0.0;
}


//Metal Fresnel
float n_min(float r){
    return (1-r)/(1+r);
}
float n_max(float r){
    return (1+sqrt(r))/(1-sqrt(r));
}
float get_n(float r,float g){
    return n_min(r)*g + (1-g)*n_max(r);
}
float get_k2(float r, float n){
    float nr = (n+1)*(n+1)*r-(n-1)*(n-1);
    return nr/(1-r);
}
float get_r(float n, float k){
    return ((n-1)*(n-1)+k*k)/((n+1)*(n+1)+k*k);
}
float get_g(float n, float k){
    float r = get_r(n,k);
    return (n_max(r)-n)/(n_max(r)-n_min(r));
}
float metalicFresnel(float r, float g,float cosTheta){
    //clamp parameters
    float _r = clamp(r,0,0.99);
    //compute n and k
    float n = get_n(_r,g);
    float k2 = get_k2(_r,n);

    float c = cosTheta;
    float rs_num = n*n + k2 - 2*n*c + c*c;
    float rs_den = n*n + k2 + 2*n*c + c*c;
    float rs = rs_num/rs_den;

    float rp_num = (n*n + k2)*c*c - 2*n*c + 1;
    float rp_den = (n*n + k2)*c*c + 2*n*c + 1;
    float rp = rp_num/rp_den;

    return 0.5*(rs+rp);
}

void main( void )
{
     // This is the place where there's work to be done
     float ka = 0.2,
           kd = 0.25,
           ks = 0.3;

     float cosTheta = 0.0;

     vec4 lightVectorNormal = normalize(lightVector),
          eyeVectorNormal   = normalize(eyeVector),
          vertNormalNormal  = normalize(vertNormal);

     //Ambient lighting:
     vec4 ambientLighting = ka * lightIntensity * vertColor;


     //Diffuse lighting:

     vec4 diffuseLighting = kd * max(dot(vertNormalNormal,lightVectorNormal),0.0) * vertColor;

     //Specular lighting:
     vec4  specularLighting;
     vec4  H              = normalize(lightVectorNormal + eyeVectorNormal);

     if (blinnPhong) {
        specularLighting  = vertColor * pow(max(dot(vertNormalNormal, H), 0.0), shininess) * lightIntensity;
     }
     else{
         float alpha        = 0.2; //roughness
         float alphaSquare  = pow(alpha,2.0);
         float cosThetaIn   = dot(H, lightVectorNormal);
         float cosThetaOut  = dot(H, eyeVectorNormal);
         float cosThetaH    = dot(H, vertNormalNormal);
         float tanInSquare  = (1.0-pow(cosThetaIn,2.0))  / pow(cosThetaIn,2.0);
         float tanOutSquare = (1.0-pow(cosThetaOut,2.0)) / pow(cosThetaOut,2.0);
         float tanHSquare   = (1.0-pow(cosThetaH,2.0))   / pow(cosThetaH,2.0);

         //formula fix from https://www.cs.cornell.edu/~srm/publications/EGSR07-btdf.pdf
         float gIn          = 2.0 / (1.0 + sqrt(1.0 + alphaSquare * tanInSquare));
         float gOut         = 2.0 / (1.0 + sqrt(1.0 + alphaSquare * tanOutSquare));

         float microfacetNormalDistribution = (indicatorX(cosThetaH)/(PI*pow(cosThetaH,4.0))) * (alphaSquare/(pow(alphaSquare + tanHSquare,2.0)));

         specularLighting = vertColor * ((microfacetNormalDistribution * gIn * gOut)/ (4.0*cosThetaIn*cosThetaOut))  * lightIntensity;
     }

     cosTheta = dot(H, eyeVectorNormal);;
     specularLighting *= fresnel2(eta, cosTheta);
     fragColor = ambientLighting + diffuseLighting + specularLighting;

}
