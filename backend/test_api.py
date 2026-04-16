"""
API测试脚本
用于测试后端API是否正常工作
"""

import requests
import json

# API地址
API_BASE_URL = "http://localhost:5000"

def test_health_check():
    """测试健康检查接口"""
    print("=" * 50)
    print("测试 1: 健康检查")
    print("=" * 50)

    try:
        response = requests.get(f"{API_BASE_URL}/api/health")
        print(f"状态码: {response.status_code}")
        print(f"响应: {response.json()}")

        if response.status_code == 200:
            print("✅ 健康检查通过")
            return True
        else:
            print("❌ 健康检查失败")
            return False
    except Exception as e:
        print(f"❌ 连接失败: {e}")
        print("请确保后端服务已启动 (python app.py)")
        return False

def test_validate_image_allowed():
    """测试验证允许的图片"""
    print("\n" + "=" * 50)
    print("测试 2: 验证允许的图片")
    print("=" * 50)

    try:
        data = {
            "imageSource": "photo/1.png"
        }

        response = requests.post(
            f"{API_BASE_URL}/api/validate-image",
            json=data,
            headers={"Content-Type": "application/json"}
        )

        print(f"状态码: {response.status_code}")
        result = response.json()
        print(f"响应: {result}")

        if result.get("valid"):
            print("✅ 图片验证通过")
            return True
        else:
            print("❌ 图片验证失败")
            return False
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        return False

def test_validate_image_rejected():
    """测试验证被拒绝的图片"""
    print("\n" + "=" * 50)
    print("测试 3: 验证用户上传的图片（应被拒绝）")
    print("=" * 50)

    try:
        data = {
            "imageSource": "data:image/png;base64,iVBORw0KGgoAAAANS..."
        }

        response = requests.post(
            f"{API_BASE_URL}/api/validate-image",
            json=data,
            headers={"Content-Type": "application/json"}
        )

        print(f"状态码: {response.status_code}")
        result = response.json()
        print(f"响应: {result}")

        if not result.get("valid"):
            print("✅ 正确拒绝了用户上传的图片")
            return True
        else:
            print("❌ 错误：应该拒绝用户上传的图片")
            return False
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        return False

def test_generate_report():
    """测试生成报告"""
    print("\n" + "=" * 50)
    print("测试 4: 生成心理分析报告")
    print("=" * 50)

    try:
        data = {
            "imageSource": "photo/1.png",
            "gameData": {
                "completionTime": "02:30",
                "moveCount": 45,
                "difficulty": "3x3",
                "gridSize": 3,
                "modifiers": {
                    "rotation": False,
                    "hidden": False,
                    "trickster": False
                },
                "pieceOrder": "按顺序完成",
                "timeIntervals": "平均间隔适中",
                "modificationCount": 15
            }
        }

        print("发送请求...")
        response = requests.post(
            f"{API_BASE_URL}/api/generate-report",
            json=data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )

        print(f"状态码: {response.status_code}")
        result = response.json()

        if response.status_code == 200 and result.get("success"):
            print("✅ 报告生成成功")
            print("\n报告内容预览:")
            print("-" * 50)
            report = result.get("report", "")
            # 只显示前500个字符
            print(report[:500] + "..." if len(report) > 500 else report)
            print("-" * 50)
            return True
        else:
            print(f"❌ 报告生成失败: {result.get('error', '未知错误')}")
            print(f"详细信息: {result.get('message', '')}")
            return False
    except requests.exceptions.Timeout:
        print("❌ 请求超时（可能是API Key未配置或网络问题）")
        return False
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        return False

def test_generate_report_with_custom_image():
    """测试用自定义图片生成报告（应被拒绝）"""
    print("\n" + "=" * 50)
    print("测试 5: 尝试用自定义图片生成报告（应被拒绝）")
    print("=" * 50)

    try:
        data = {
            "imageSource": "data:image/png;base64,iVBORw0KGgoAAAANS...",
            "gameData": {
                "completionTime": "02:30",
                "moveCount": 45,
                "difficulty": "3x3"
            }
        }

        response = requests.post(
            f"{API_BASE_URL}/api/generate-report",
            json=data,
            headers={"Content-Type": "application/json"}
        )

        print(f"状态码: {response.status_code}")
        result = response.json()
        print(f"响应: {result}")

        if response.status_code == 403:
            print("✅ 正确拒绝了自定义图片的分析请求")
            return True
        else:
            print("❌ 错误：应该拒绝自定义图片的分析")
            return False
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        return False

def run_all_tests():
    """运行所有测试"""
    print("\n" + "=" * 50)
    print("开始运行API测试")
    print("=" * 50)

    results = []

    # 测试1: 健康检查
    results.append(("健康检查", test_health_check()))

    # 如果健康检查失败，不继续后续测试
    if not results[0][1]:
        print("\n后端服务未启动，停止测试")
        return

    # 测试2: 验证允许的图片
    results.append(("验证允许的图片", test_validate_image_allowed()))

    # 测试3: 验证被拒绝的图片
    results.append(("验证拒绝用户图片", test_validate_image_rejected()))

    # 测试4: 生成报告
    results.append(("生成报告", test_generate_report()))

    # 测试5: 拒绝自定义图片
    results.append(("拒绝自定义图片", test_generate_report_with_custom_image()))

    # 输出测试结果
    print("\n" + "=" * 50)
    print("测试结果汇总")
    print("=" * 50)

    passed = 0
    failed = 0

    for test_name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
        else:
            failed += 1

    print("\n" + "=" * 50)
    print(f"总计: {len(results)} 个测试")
    print(f"通过: {passed} 个")
    print(f"失败: {failed} 个")
    print("=" * 50)

    if failed == 0:
        print("\n🎉 所有测试通过！后端API工作正常。")
    else:
        print(f"\n⚠️  有 {failed} 个测试失败，请检查配置。")
        if failed == 1 and not results[3][1]:
            print("\n提示：如果只有'生成报告'测试失败，请检查：")
            print("1. DEEPSEEK_API_KEY 是否正确配置在 .env 文件中")
            print("2. API Key 是否有效且有剩余额度")
            print("3. 网络连接是否正常")

if __name__ == "__main__":
    run_all_tests()
