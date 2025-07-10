import 'package:flutter/material.dart';
import 'package:loading_animation_widget/loading_animation_widget.dart';
import '../utils/theme.dart';

class CustomButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final bool isOutlined;
  final IconData? icon;
  final Color? backgroundColor;
  final Color? textColor;
  final double? width;
  final double? height;
  final EdgeInsetsGeometry? padding;
  final BoxDecoration? gradient;

  const CustomButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.isOutlined = false,
    this.icon,
    this.backgroundColor,
    this.textColor,
    this.width,
    this.height,
    this.padding,
    this.gradient,
  });

  @override
  Widget build(BuildContext context) {
    Widget buttonChild = Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (isLoading)
          LoadingAnimationWidget.staggeredDotsWave(
            color: textColor ?? Colors.white,
            size: 20,
          )
        else ...[
          if (icon != null) ...[
            Icon(icon, size: 18),
            const SizedBox(width: 8),
          ],
          Text(
            text,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: textColor ?? (isOutlined ? AppTheme.primaryColor : Colors.white),
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ],
    );

    if (gradient != null) {
      return Container(
        width: width,
        height: height ?? 48,
        decoration: gradient!.copyWith(
          borderRadius: BorderRadius.circular(12),
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onPressed,
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: padding ?? const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              child: buttonChild,
            ),
          ),
        ),
      );
    }

    if (isOutlined) {
      return SizedBox(
        width: width,
        height: height ?? 48,
        child: OutlinedButton(
          onPressed: onPressed,
          style: OutlinedButton.styleFrom(
            backgroundColor: backgroundColor,
            padding: padding ?? const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          ),
          child: buttonChild,
        ),
      );
    }

    return SizedBox(
      width: width,
      height: height ?? 48,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: backgroundColor ?? AppTheme.primaryColor,
          padding: padding ?? const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        ),
        child: buttonChild,
      ),
    );
  }
}