// // The module 'vscode' contains the VS Code extensibility API
// // Import the module and reference it with the alias vscode in your code below
// import * as vscode from 'vscode';

// // This method is called when your extension is activated
// // Your extension is activated the very first time the command is executed
// export function activate(context: vscode.ExtensionContext) {

// 	// Use the console to output diagnostic information (console.log) and errors (console.error)
// 	// This line of code will only be executed once when your extension is activated
// 	console.log('Congratulations, your extension "project-directory-creator" is now active!');

// 	// The command has been defined in the package.json file
// 	// Now provide the implementation of the command with registerCommand
// 	// The commandId parameter must match the command field in package.json
// 	const disposable = vscode.commands.registerCommand('project-directory-creator.helloWorld', () => {
// 		// The code you place here will be executed every time your command is executed
// 		// Display a message box to the user
// 		vscode.window.showInformationMessage('Hello World from Project Directory Creator!');
// 	});

// 	context.subscriptions.push(disposable);
// }

// // This method is called when your extension is deactivated
// export function deactivate() {}


import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.createProjectStructure', async () => {
        const projectType = await vscode.window.showQuickPick(
            ['Template Setup', 'Manual Setup'],
            { placeHolder: 'Choose a method to create your project directory' }
        );

        switch (projectType) {
            case 'Template Setup':
                await createCustomTemplate();
                break;
            case 'Manual Setup':
                await createManualProject();
                break;
        }
    });

    context.subscriptions.push(disposable);
}

async function createManualProject() {
    const baseFolderPath = await vscode.window.showInputBox({
        prompt: 'Enter the base directory name for your project'
    });

    if (!baseFolderPath) {
        return;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
        const rootPath = workspaceFolders[0].uri.fsPath;


        const baseNumFiles = await vscode.window.showInputBox({
            prompt: `How many files do you want to create in the base directory? (default 0)`,
            validateInput: (value) => (value === '' || !isNaN(Number(value))) ? null : 'Please enter a valid number'
        });

        const baseFilesParsed = baseNumFiles ? parseInt(baseNumFiles) : 0;
        await createFolderAndFiles(rootPath, baseFolderPath, baseFilesParsed);

        // Ask for subfolders
        const numFolders = await vscode.window.showInputBox({
            prompt: 'How many subfolders do you want to create?',
            validateInput: (value) => isNaN(Number(value)) ? 'Please enter a valid number' : null
        });

        if (!numFolders) {
            return;
        }

        const num = parseInt(numFolders);
        for (let i = 0; i < num; i++) {
            const folderName = await vscode.window.showInputBox({
                prompt: `Enter the name for subfolder ${i + 1}`
            });

            if (folderName) {
                const numFiles = await vscode.window.showInputBox({
                    prompt: `How many files in subfolder "${folderName}"? (default 0)`,
                    validateInput: (value) => (value === '' || !isNaN(Number(value))) ? null : 'Please enter a valid number'
                });

                const numFilesParsed = numFiles ? parseInt(numFiles) : 0;
                await createFolderAndFiles(rootPath, path.join(baseFolderPath, folderName), numFilesParsed);
            }
        }

  
        vscode.commands.executeCommand('workbench.files.action.refreshFilesExplorer');
    }
}

async function createFolderAndFiles(rootPath: string, folderPath: string, numFiles: number) {
    const fullFolderPath = path.join(rootPath, folderPath);
    fs.mkdirSync(fullFolderPath, { recursive: true });

    for (let i = 0; i < numFiles; i++) {
        let fileName = await vscode.window.showInputBox({
            prompt: `Enter the name for file ${i + 1} in folder "${folderPath}" (default: main)`,
        });
        fileName = fileName ? fileName : 'main'; 

        const fileExtension = await vscode.window.showQuickPick(
            ['html', 'css', 'js', 'py', 'md', 'txt', 'json', 'xml','c','cpp','java', 'other'],
            {
                placeHolder: `Select or type the extension for file "${fileName}" (default: txt)`,
            }
        );

        let extension = 'txt'; // Default extension
        if (fileExtension === 'other') {
            const customExtension = await vscode.window.showInputBox({
                prompt: 'Enter a custom file extension (e.g. ipynb)',
            });
            extension = customExtension ? customExtension : 'txt'; // Use the custom extension or default to txt
        } else if (fileExtension) {
            extension = fileExtension;
        }

        const filePath = path.join(fullFolderPath, `${fileName}.${extension}`);
        fs.writeFileSync(filePath, '');
    }

    vscode.window.showInformationMessage(`Folder "${folderPath}" and ${numFiles} files created at ${fullFolderPath}`);
}

async function createCustomTemplate() {
    const templates = [
        'Full Stack', 'Machine Learning', 'Basic', 
        'Data Science', 'Web API', 'Python Package', 
        'Mobile App', 'Web Scraping'
    ];

    const selectedTemplate = await vscode.window.showQuickPick(templates, {
        placeHolder: 'Choose a template for your project'
    });

    if (!selectedTemplate) {
        return;
    }

    const folderPath = await vscode.window.showInputBox({
        prompt: 'Enter the directory name for your project'
    });

    if (folderPath) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders) {
            const fullFolderPath = path.join(workspaceFolders[0].uri.fsPath, folderPath);
            fs.mkdirSync(fullFolderPath, { recursive: true });

 
            createTemplateStructure(selectedTemplate, fullFolderPath);

            vscode.window.showInformationMessage(`Project created with ${selectedTemplate} template at ${fullFolderPath}`);


            vscode.commands.executeCommand('workbench.files.action.refreshFilesExplorer');
        }
    }
}

function createTemplateStructure(template: string, baseDir: string) {
    const templates: { [key: string]: () => void } = {
        'Full Stack': () => {
            const structure: [string, ...string[]][] = [
                ['client/public', 'index.html', 'favicon.ico'],
                ['client/src/components', 'App.js', 'Header.js'],
                ['client/src', 'App.js', 'index.js'],
                ['server/controllers', 'userController.js', 'authController.js'],
                ['server/models', 'userModel.js', 'postModel.js'],
                ['server/routes', 'userRoutes.js', 'postRoutes.js'],
                ['server', 'server.js', 'package.json'],
                ['client', 'package.json', 'webpack.config.js']
            ];
            createStructure(baseDir, structure);
        },
        'Machine Learning': () => {
            const structure: [string, ...string[]][] = [
                ['data/raw', 'dataset.csv'],
                ['data/processed', 'cleaned_data.csv'],
                ['notebooks', 'EDA.ipynb', 'model_training.ipynb'],
                ['models', 'model.pkl', 'model_performance.txt'],
                ['src', 'preprocess.py', 'train.py', 'predict.py'],
                ['', 'requirements.txt', 'README.md', 'main.py']
            ];
            createStructure(baseDir, structure);
        },
        'Basic': () => {
            const structure: [string, ...string[]][] = [
                ['src', 'index.html', 'styles.css', 'app.js'],
                ['assets/images', ''],
                ['assets/icons', ''],
                ['', 'README.md']
            ];
            createStructure(baseDir, structure);
        },
        'Data Science': () => {
            const structure: [string, ...string[]][] = [
                ['data', 'raw_data.csv', 'processed_data.csv', 'features.csv'],
                ['notebooks', 'data_cleaning.ipynb', 'feature_engineering.ipynb', 'model_evaluation.ipynb'],
                ['scripts', 'data_preprocessing.py', 'feature_selection.py', 'model_train.py'],
                ['results', 'accuracy_scores.txt', 'confusion_matrix.png'],
                ['models', 'final_model.pkl', 'test_predictions.csv'],
                ['', 'README.md']
            ];
            createStructure(baseDir, structure);
        },
        'Web API': () => {
            const structure: [string, ...string[]][] = [
                ['controllers', 'userController.js', 'authController.js', 'productController.js'],
                ['models', 'userModel.js', 'productModel.js', 'orderModel.js'],
                ['routes', 'userRoutes.js', 'authRoutes.js', 'productRoutes.js'],
                ['middleware', 'authMiddleware.js'],
                ['config', 'db.js'],
                ['', 'server.js', 'package.json', 'README.md']
            ];
            createStructure(baseDir, structure);
        },
        'Python Package': () => {
            const structure: [string, ...string[]][] = [
                ['src/my_package', '__init__.py', 'module1.py', 'module2.py'],
                ['tests', 'test_module1.py', 'test_module2.py'],
                ['', 'setup.py', 'requirements.txt', 'README.md']
            ];
            createStructure(baseDir, structure);
        },
        'Mobile App': () => {
            const structure: [string, ...string[]][] = [
                ['src/components', 'Button.js'],
                ['src/screens', 'HomeScreen.js'],
                ['src', 'App.js', 'index.js'],
                ['assets/images', ''],
                ['assets/fonts', ''],
                ['', 'package.json', 'README.md']
            ];
            createStructure(baseDir, structure);
        },
        'Web Scraping': () => {
            const structure: [string, ...string[]][] = [
                ['data/raw_html', ''],
                ['data', 'scraped_data.csv'],
                ['scripts', 'scraper.py', 'parser.py', 'data_cleaner.py'],
                ['results', 'output_data.csv', 'data_analysis.ipynb'],
                ['', 'requirements.txt', 'README.md']
            ];
            createStructure(baseDir, structure);
        }
    };

    if (templates[template]) {
        templates[template]();
    }
}

function createStructure(baseDir: string, structure: [string, ...string[]][]) {
    structure.forEach(([folderPath, ...fileNames]) => {
        const folderFullPath = path.join(baseDir, folderPath);
        fs.mkdirSync(folderFullPath, { recursive: true });
        fileNames.forEach(fileName => {
            if (fileName) {
                const fileFullPath = path.join(folderFullPath, fileName);
                fs.writeFileSync(fileFullPath, '');
            }
        });
    });
}

export function deactivate() {}
