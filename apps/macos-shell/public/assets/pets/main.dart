import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:universal_html/html.dart' as html;
import 'package:rive/rive.dart' as rive;

import 'common_rive_widget.dart';

void main() async {
  try {
    await rive.RiveNative.init();
  } catch (e) {
    debugPrint('Rive 初始化失败: $e');
  }

  FlutterError.onError = (FlutterErrorDetails details) {
    final String errorStr = details.exceptionAsString();
    if (errorStr.contains('PointerDeviceKind.trackpad') &&
        errorStr.contains('!identical(kind, PointerDeviceKind.trackpad)')) {
      debugPrint('忽略 macOS trackpad 手势断言，继续运行');
      return;
    }
    FlutterError.presentError(details);
  };

  runZonedGuarded(
        () async {
      WidgetsFlutterBinding.ensureInitialized();
      if (kIsWeb) {
        html.window.onBeforeUnload.listen((_) {
          WidgetsBinding.instance.scheduleFrameCallback((_) => null);
        });
      }
      runApp(MyApp());
    },
        (error, stack) {
      if (error.toString().contains('EngineFlutterView') ||
          error.toString().contains('disposed')) {
        debugPrint('Ignored Flutter Web engine dispose error: $error');
        return;
      }
      debugPrint('Uncaught error: $error\n$stack');
    },
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final designSize = Size(1920, 1080);
    return ScreenUtilInit(
      designSize: designSize,
      minTextAdapt: true,
      splitScreenMode: true,
      child: GetMaterialApp(
        title: 'Rive Demo',
        debugShowCheckedModeBanner: false,
        initialRoute: '/',
        getPages: _buildGetPages(),
        builder: (context, widget) {
          return MediaQuery(
            data: MediaQuery.of(context).copyWith(textScaler: TextScaler.noScaling),
            child: widget!,
          );
        },
      ),
    );
  }

  List<GetPage> _buildGetPages() {
    return [GetPage(name: '/', page: () => const RiveGridPage())];
  }
}

class RiveGridPage extends StatefulWidget {
  const RiveGridPage({super.key});
  

  @override
  State<RiveGridPage> createState() => _RiveGridPageState();
}

class _RiveGridPageState extends State<RiveGridPage> {
  final List<RiveItemController> _itemControllers = List.generate(4, (_) => RiveItemController());

  final List<String> _riveAssets = [
    'assets/rive/monk.riv',
    'assets/rive/robot.riv',
    'assets/rive/cat.riv',
    'assets/rive/lobster.riv',
  ];

  @override
  void dispose() {
    for (var controller in _itemControllers) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.all(16.w),
          child: GridView.builder(
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 16.w,
              mainAxisSpacing: 16.h,
              childAspectRatio: 0.8,
            ),
            itemCount: 4,
            itemBuilder: (context, index) {
              return _buildRiveCard(index);
            },
          ),
        ),
      ),
    );
  }

  Widget _buildRiveCard(int index) {
    final controller = _itemControllers[index];
    final assetPath = _riveAssets[index % _riveAssets.length];

    return Container(
      decoration: BoxDecoration(
        color: Colors.grey.shade900,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: Colors.grey.shade700),
      ),
      child: Column(
        children: [
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.vertical(top: Radius.circular(12.r)),
              child: EnhancedRiveWidget(
                url: assetPath,
                isAsset: true,
                fit: rive.Fit.contain,
                onReady: (riveController) => controller.onRiveReady(riveController),
                onEvent: (event) => debugPrint('Rive event from $index: ${event.name}'),
              ),
            ),
            flex: 3,
          ),
          Expanded(
            flex: 1,
            child: Container(
              padding: EdgeInsets.symmetric(vertical: 12.h),
              decoration: BoxDecoration(
                color: Colors.grey.shade800,
                borderRadius: BorderRadius.vertical(bottom: Radius.circular(12.r)),
              ),
              child: Obx(() {
                final hasBooleanInput = controller.hasBooleanInput.value;
                final isOn = controller.booleanInputValue.value;

                return Column(
                  children: [
                    if (!hasBooleanInput)
                      Text(
                        '未找到布尔输入',
                        style: TextStyle(color: Colors.grey.shade400, fontSize: 12.sp),
                      )
                    else
                      ElevatedButton(
                        onPressed: () => controller.toggleBoolean(),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: isOn ? Colors.green : Colors.grey,
                          foregroundColor: Colors.white,
                          padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 10.h),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20.r),
                          ),
                        ),
                        child: Text(
                          '工作: ${isOn ? "开启" : "关闭"}',
                          style: TextStyle(fontSize: 14.sp),
                        ),
                      ),
                    SizedBox(height: 4.h),
                    Text(
                      'Rive ${index + 1}',
                      style: TextStyle(color: Colors.white70, fontSize: 12.sp),
                    ),
                  ],
                );
              }),
            ),
          ),
        ],
      ),
    );
  }
}

class RiveItemController {
  rive.RiveWidgetController? _riveController;
  rive.BooleanInput? _booleanInput;

  final booleanInputValue = RxBool(false);
  final hasBooleanInput = RxBool(false);

  void onRiveReady(rive.RiveWidgetController controller) {
    _riveController = controller;
    // 使用延迟执行，避免在构建过程中更新状态
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _findFirstBooleanInput();
    });
  }

  void _findFirstBooleanInput() {
    if (_riveController == null) return;

    try {
      // 尝试获取布尔输入
      _booleanInput = _riveController?.stateMachine.boolean('state');
      if (_booleanInput != null) {
        hasBooleanInput.value = true;
        booleanInputValue.value = _booleanInput!.value;
        debugPrint('找到布尔输入: state, 初始值: ${_booleanInput!.value}');
      }else{
        // 没找到布尔输入
        hasBooleanInput.value = false;
        debugPrint('未在 Rive 文件中找到布尔输入');
      }
    } catch (e) {
      hasBooleanInput.value = false;
      debugPrint('查找布尔输入失败: $e');
    }
  }

  void toggleBoolean() {
    if (_booleanInput != null) {
      final newValue = !_booleanInput!.value;
      _booleanInput!.value = newValue;
      booleanInputValue.value = newValue;
      debugPrint('切换布尔输入 ${_booleanInput!.name} 为 $newValue');
    } else {
      debugPrint('无法切换：未找到布尔输入');
    }
  }

  void dispose() {
    _riveController = null;
    _booleanInput = null;
  }
}