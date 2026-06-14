package com.zdapao509;

/**
 * zdapao509 的 Java 项目 — 主应用入口
 */
public class App {

    public static void main(String[] args) {
        System.out.println("Hello from zdapao509!");
        System.out.println("项目: zdapao20260614");
        System.out.println("Java 版本: " + System.getProperty("java.version"));
        System.out.println("a new file!");
        if (args.length > 0) {
            System.out.println("传入参数:");
            for (int i = 0; i < args.length; i++) {
                System.out.println("  [" + i + "] " + args[i]);
            }
        }
    }
}
