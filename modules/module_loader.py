"""
Module Loader
Dynamically loads and manages modules
"""

import importlib
import sys
from pathlib import Path

class ModuleLoader:
    def __init__(self, core):
        self.core = core
        self.modules_dir = Path(__file__).parent.parent / 'modules'
        
    async def load_all(self):
        """Load all modules"""
        modules = {}
        
        if not self.modules_dir.exists():
            print("⚠️  Modules directory not found")
            return modules
            
        # Add modules directory to Python path
        sys.path.insert(0, str(self.modules_dir.parent))
        
        for file_path in self.modules_dir.glob('*.py'):
            if file_path.name.startswith('_'):
                continue
                
            module_name = file_path.stem
            try:
                # Import module
                spec = importlib.util.spec_from_file_location(
                    f"modules.{module_name}",
                    file_path
                )
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                
                # Get module class (assume it's named after file with capitalization)
                class_name = ''.join(word.capitalize() for word in module_name.split('_')) + 'Module'
                
                if hasattr(module, class_name):
                    module_class = getattr(module, class_name)
                    instance = module_class(self.core)
                    modules[module_name] = instance
                    print(f"✓ Loaded module: {module_name}")
                    
            except Exception as e:
                print(f"✗ Failed to load {module_name}: {e}")
                import traceback
                traceback.print_exc()
                
        return modules
