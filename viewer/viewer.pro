
DESTDIR = ../viewer
QT       += core gui opengl

TARGET = myViewer
TEMPLATE = app

macx {
  QMAKE_CXXFLAGS += -Wno-unknown-pragmas
} else {
  QMAKE_LFLAGS += -Wno-unknown-pragmas -fopenmp
}

SOURCES +=  \
            src/main.cpp \
            src/openglwindow.cpp \
            src/glshaderwindow.cpp

HEADERS  += \
            src/openglwindow.h \
            src/glshaderwindow.h \
    src/perlinNoise.h



OTHER_FILES +=  \
    shaders/1_simple.frag \
    shaders/1_simple.vert \
    shaders/2_phong.frag \
    shaders/2_phong.vert \
    shaders/3_textured.frag \
    shaders/3_textured.vert \
    shaders/7_noiseAlone.frag \
    shaders/7_noiseAlone.vert \
    shaders/8_gpgpu_spherert.vert \
    shaders/8_gpgpu_spherert.frag \
    shaders/h_shadowMapGeneration.frag \
    shaders/h_shadowMapGeneration.vert \
    shaders/gpgpu_fullrt.frag \
    shaders/gpgpu_fullrt.vert \
    shaders/gpgpu_fullrt.comp


# trimesh library for loading objects.
# Reference/source: http://gfx.cs.princeton.edu/proj/trimesh2/
INCLUDEPATH += ../trimesh2/include/
LIBS += -L../trimesh2/lib -ltrimesh


