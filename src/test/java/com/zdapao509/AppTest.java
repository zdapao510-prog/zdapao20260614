package com.zdapao509;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * App µÄµ¥Ôª²âÊÔ
 */
class AppTest {

    @Test
    void testAppHasMainMethod() throws NoSuchMethodException {
        Class<?> clazz = App.class;
        clazz.getMethod("main", String[].class);
        assertTrue(true, "App class has main method");
    }

    @Test
    void testAppClassExists() {
        assertNotNull(App.class, "App class should exist");
    }
}
