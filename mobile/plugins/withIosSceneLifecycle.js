const {
  withDangerousMod,
  withInfoPlist,
  withXcodeProject,
  IOSConfig,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const SCENE_DELEGATE = `import React
import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard
      let windowScene = scene as? UIWindowScene,
      let appDelegate = UIApplication.shared.delegate as? AppDelegate,
      let factory = appDelegate.reactNativeFactory
    else {
      return
    }

    let window = UIWindow(windowScene: windowScene)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: appDelegate.launchOptions
    )

    appDelegate.window = window
    self.window = window

    for context in connectionOptions.urlContexts {
      _ = RCTLinkingManager.application(UIApplication.shared, open: context.url, options: [:])
    }
    for activity in connectionOptions.userActivities {
      _ = RCTLinkingManager.application(
        UIApplication.shared,
        continue: activity,
        restorationHandler: { _ in }
      )
    }
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    for context in URLContexts {
      _ = RCTLinkingManager.application(UIApplication.shared, open: context.url, options: [:])
    }
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    _ = RCTLinkingManager.application(
      UIApplication.shared,
      continue: userActivity,
      restorationHandler: { _ in }
    )
  }
}
`;

/**
 * iOS 27+: UIScene lifecycle zorunlu. Manifest + SceneDelegate + AppDelegate patch.
 * EAS prebuild bu plugin ile üretir — kütüphane değişimi bunu çözmez.
 */
function withIosSceneLifecycle(config) {
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    };
    return cfg;
  });

  config = withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const projectRoot = cfg.modRequest.platformProjectRoot;
      const projectName = IOSConfig.XcodeUtils.getProjectName(
        cfg.modRequest.projectRoot,
      );
      const appDir = path.join(projectRoot, projectName);

      fs.writeFileSync(path.join(appDir, 'SceneDelegate.swift'), SCENE_DELEGATE);

      const appDelegatePath = path.join(appDir, 'AppDelegate.swift');
      if (fs.existsSync(appDelegatePath)) {
        let src = fs.readFileSync(appDelegatePath, 'utf8');

        if (!src.includes('var launchOptions:')) {
          src = src.replace(
            'var reactNativeFactory: RCTReactNativeFactory?',
            'var reactNativeFactory: RCTReactNativeFactory?\n  var launchOptions: [UIApplication.LaunchOptionsKey: Any]?',
          );
        }

        if (!src.includes('self.launchOptions = launchOptions')) {
          src = src.replace(
            'didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil\n  ) -> Bool {\n',
            'didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil\n  ) -> Bool {\n    self.launchOptions = launchOptions\n\n',
          );
        }

        src = src.replace(/#if os\(iOS\) \|\| os\(tvOS\)[\s\S]*?#endif\n/, '');
        src = src.replace(
          /class AppDelegate: ExpoAppDelegate,\s*ExpoReactNativeFactoryProvider/,
          'class AppDelegate: ExpoAppDelegate',
        );

        fs.writeFileSync(appDelegatePath, src);
      }

      return cfg;
    },
  ]);

  config = withXcodeProject(config, (cfg) => {
    const project = cfg.modResults;
    const projectName =
      cfg.modRequest.projectName ||
      IOSConfig.XcodeUtils.getProjectName(cfg.modRequest.projectRoot);
    const filePath = `${projectName}/SceneDelegate.swift`;

    if (!project.hasFile(filePath)) {
      project.addSourceFile(
        filePath,
        null,
        project.findPBXGroupKey({ name: projectName }),
      );
    }

    return cfg;
  });

  return config;
}

module.exports = withIosSceneLifecycle;
