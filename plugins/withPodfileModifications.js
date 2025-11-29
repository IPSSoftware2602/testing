const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withPodfileModifications(config) {
    return withDangerousMod(config, [
        'ios',
        async (config) => {
            const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
            let podfileContent = fs.readFileSync(podfilePath, 'utf-8');

            // Add use_modular_headers! at the top of the Podfile (after require lines)
            if (!podfileContent.includes('use_modular_headers!')) {
                // Find the first line after require statements (usually the platform line)
                const lines = podfileContent.split('\n');
                let insertIndex = 0;

                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].includes('platform :ios')) {
                        insertIndex = i;
                        break;
                    }
                }

                lines.splice(insertIndex, 0, 'use_modular_headers!');
                podfileContent = lines.join('\n');
            }

            // Also add post_install hook for non-modular includes
            const postInstallHook = `
  post_install do |installer|
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['BUILD_LIBRARY_FOR_DISTRIBUTION'] = 'YES'
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      end
    end
  end`;

            // Check if post_install already exists
            if (!podfileContent.includes('post_install do |installer|')) {
                // Add before the final 'end'
                podfileContent = podfileContent.replace(/end\s*$/, postInstallHook + '\nend');
            }

            fs.writeFileSync(podfilePath, podfileContent);
            return config;
        },
    ]);
};
