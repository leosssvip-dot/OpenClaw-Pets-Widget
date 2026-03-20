import 'package:flutter/material.dart';
import 'package:rive/rive.dart' as rive;
import 'package:flutter/foundation.dart';
typedef RiveOnReady = void Function(rive.RiveWidgetController controller);
typedef RiveOnEvent = void Function(rive.Event event);

class EnhancedRiveWidget extends StatefulWidget {
  final String url;
  final bool isAsset;
  final String? artboardName;
  final RiveOnReady? onReady;
  final RiveOnEvent? onEvent;
  final rive.Fit fit;

  const EnhancedRiveWidget({
    super.key,
    required this.url,
    this.isAsset = false,
    this.artboardName,
    this.onReady,
    this.onEvent,
    this.fit = rive.Fit.contain,
  });

  @override
  State<EnhancedRiveWidget> createState() => _EnhancedRiveWidgetState();
}

class _EnhancedRiveWidgetState extends State<EnhancedRiveWidget> {
  late final rive.FileLoader _fileLoader;
  bool _isInitialized = false;
  rive.RiveWidgetController? _currentController; // 持有控制器引用

  @override
  void initState() {
    super.initState();
    _initRive();
  }


  Future<void> _initRive() async {
    //  自动选择工厂：Web 端用 Flutter 原生渲染，App 端用 Rive Renderer
    final riveFactory = kIsWeb ? rive.Factory.flutter : rive.Factory.rive;

    if (widget.isAsset) {
      _fileLoader = rive.FileLoader.fromAsset(
        widget.url,
        riveFactory: riveFactory,
      );
    } else {
      _fileLoader = rive.FileLoader.fromUrl(
        widget.url,
        riveFactory: riveFactory,
      );
    }
  }

  void _setupController(rive.RiveWidgetController controller) {

    if (_currentController == controller) return; // 防止重复设置

    // 如果之前已经有控制器，先移除旧的监听
    if (_currentController != null && widget.onEvent != null) {
      _currentController!.stateMachine.removeEventListener(widget._onEventInternal);
    }
    _currentController = controller;

    // 绑定新事件
    if (widget.onEvent != null) {
      controller.stateMachine.addEventListener(widget._onEventInternal);
    }

    // 只有在真正“第一次”准备好时才通知外部
    if (!_isInitialized) {
      widget.onReady?.call(controller);
      _isInitialized = true;
    }
  }

  @override
  void dispose() {
    if (_currentController != null) {
      if (widget.onEvent != null) {
        _currentController!.stateMachine.removeEventListener(widget._onEventInternal);
      }
      //  需要手动 dispose 控制器来释放 WASM 内存
      _currentController = null;
    }
    _fileLoader.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return rive.RiveWidgetBuilder(
      fileLoader: _fileLoader,
      artboardSelector: widget.artboardName != null
          ? rive.ArtboardSelector.byName(widget.artboardName!)
          : rive.ArtboardSelector.byIndex(0),
      builder: (context, state) => switch (state) {
        rive.RiveLoading() => const Center(child: CircularProgressIndicator()),
        rive.RiveFailed() => Center(child: Text('Rive Load Failed: ${state.error}')),
        rive.RiveLoaded() => (() {
          _setupController(state.controller);
          return rive.RiveWidget(
            controller: state.controller,
            fit: widget.fit,
          );
        }()),
      },
    );
  }
}

extension _InternalEvent on EnhancedRiveWidget {
  void _onEventInternal(rive.Event event) {
    onEvent?.call(event);
  }
}