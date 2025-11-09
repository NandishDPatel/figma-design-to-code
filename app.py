import streamlit as st
import requests
import os
import re
import json
import tempfile
import shutil
from pathlib import Path
import subprocess
import sys

# Page configuration
st.set_page_config(page_title="Figma to HTML Converter", page_icon="🎨", layout="wide")

# Custom CSS
st.markdown(
    """
<style>
    .main-header {
        font-size: 3rem;
        font-weight: 700;
        text-align: center;
        margin-bottom: 1rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .success-box {
        padding: 2rem;
        background: #f0f9ff;
        border-radius: 10px;
        border-left: 4px solid #10b981;
        margin: 1rem 0;
    }
    .error-box {
        padding: 1rem;
        background: #fef2f2;
        border-radius: 10px;
        border-left: 4px solid #dc2626;
        margin: 1rem 0;
    }
</style>
""",
    unsafe_allow_html=True,
)


def extract_file_key(url):
    """Extract file key from Figma URL"""
    match = re.search(r"figma\.com/(?:design|file)/([a-zA-Z0-9]+)", url)
    return match.group(1) if match else None


def run_figma_converter(access_token, file_key, output_dir):
    """
    Run your existing Node.js Figma converter
    This calls your CLI tool and generates files in output directory
    """
    try:
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)

        # Set environment variables for the subprocess
        env = os.environ.copy()
        env["FIGMA_ACCESS_TOKEN"] = access_token
        env["FIGMA_URL"] = file_key

        # Run your Node.js converter with proper encoding handling
        result = subprocess.run(
            ["node", "index.js"],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="ignore",
            cwd=os.getcwd(),
            env=env,
        )

        # ✅ PRINT ALL OUTPUT TO SEE WHAT'S HAPPENING
        st.write("=== FULL CONVERTER OUTPUT ===")
        st.write("STDOUT:", result.stdout)
        if result.stderr:
            st.write("STDERR:", result.stderr)
        st.write("RETURN CODE:", result.returncode)
        st.write("=============================")

        if result.returncode != 0:
            raise Exception(f"Converter failed: {result.stderr}")

        return True

    except Exception as e:
        st.error(f"Error running converter: {str(e)}")
        return False

        if result.returncode != 0:
            error_msg = result.stderr if result.stderr else "Unknown error"
            raise Exception(
                f"Converter failed with exit code {result.returncode}: {error_msg}"
            )

        return True

    except Exception as e:
        st.error(f"Error running converter: {str(e)}")
        return False


def read_generated_files(output_dir):
    """
    Read the generated HTML and CSS files from output directory
    """
    html_file = Path(output_dir) / "index.html"
    css_file = Path(output_dir) / "styles.css"

    html_content = ""
    css_content = ""

    try:
        if html_file.exists():
            with open(html_file, "r", encoding="utf-8", errors="ignore") as f:
                html_content = f.read()

        if css_file.exists():
            with open(css_file, "r", encoding="utf-8", errors="ignore") as f:
                css_content = f.read()
    except Exception as e:
        st.error(f"Error reading generated files: {e}")

    return html_content, css_content


def count_elements_in_html(html_content):
    """
    Count HTML elements to show conversion stats
    """
    if not html_content:
        return 0

    # Simple count of div elements
    div_count = html_content.count("<div")
    return div_count


def main():
    # Header
    st.markdown(
        '<h1 class="main-header">🎨 Figma to HTML Converter</h1>',
        unsafe_allow_html=True,
    )
    st.markdown("Convert your Figma designs to clean HTML/CSS code instantly!")

    # Instructions
    with st.expander("📋 How to use"):
        st.markdown(
            """
        1. **Get your Figma Access Token** from [Account Settings → Personal Access Tokens](https://www.figma.com/settings)
        2. **Copy your Figma file URL** (should look like: `https://figma.com/design/ABC123/Project-Name`)
        3. **Paste both below** and click Convert
        4. **View and download** your generated HTML and CSS files
        """
        )

    # Main form
    col1, col2 = st.columns(2)

    with col1:
        access_token = st.text_input(
            "Figma Access Token",
            type="password",
            placeholder="figd_xxxxxxxxxxxxxxxxxxxxxxxx",
            help="Get this from Figma Account Settings → Personal Access Tokens",
        )

    with col2:
        figma_url = st.text_input(
            "Figma File URL",
            placeholder="https://figma.com/design/ABC123/Project-Name",
            help="Paste your Figma design URL here",
        )

    # Convert button
    if st.button("🚀 Convert to HTML/CSS", use_container_width=True):
        if not access_token or not figma_url:
            st.error("❌ Please provide both Access Token and Figma URL")
            return

        file_key = extract_file_key(figma_url)
        if not file_key:
            st.error("❌ Invalid Figma URL. Please check the format.")
            return

        # Show loading
        with st.spinner("🔄 Converting your Figma design... This may take a moment."):
            try:
                # Run the converter
                output_dir = "./output"  # Fixed output directory
                success = run_figma_converter(access_token, file_key, output_dir)

                if not success:
                    st.error("❌ Conversion failed. Check the error details above.")
                    return

                # Read generated files
                html_content, css_content = read_generated_files(output_dir)

                if not html_content and not css_content:
                    st.error(
                        "❌ No files were generated. Check if the converter ran successfully."
                    )
                    return

                # Count elements for stats
                element_count = count_elements_in_html(html_content)

                # Success message
                st.markdown(
                    f"""
                <div class="success-box">
                    <h3>✅ Conversion Successful!</h3>
                    <p>Generated HTML and CSS files in <code>{output_dir}</code></p>
                    <p><strong>{element_count}</strong> elements converted from your Figma design.</p>
                </div>
                """,
                    unsafe_allow_html=True,
                )

                # Create tabs for different views
                tab1, tab2, tab3, tab4, tab5 = st.tabs(
                    [
                        "👁️ Live Preview",
                        "📄 HTML Preview",
                        "🎨 CSS Preview",
                        "📁 File Browser",
                        "⬇️ Download",
                    ]
                )

                with tab1:
                    st.subheader("Live Preview")
                    if html_content and css_content:
                        # Create a combined HTML with CSS for preview
                        preview_html = html_content.replace(
                            "</head>", f"<style>{css_content}</style></head>"
                        )
                        st.components.v1.html(preview_html, height=600, scrolling=True)
                    else:
                        st.info("Preview not available - missing HTML or CSS content")

                with tab2:
                    st.subheader("Generated HTML")
                    if html_content:
                        st.code(html_content, language="html")
                    else:
                        st.warning("No HTML file generated")

                with tab3:
                    st.subheader("Generated CSS")
                    if css_content:
                        st.code(css_content, language="css")
                    else:
                        st.warning("No CSS file generated")

                with tab4:
                    st.subheader("Generated Files")
                    if Path(output_dir).exists():
                        files = list(Path(output_dir).glob("*"))
                        if files:
                            for file in files:
                                col1, col2 = st.columns([3, 2])
                                with col1:
                                    st.write(f"📄 {file.name}")
                                with col2:
                                    st.write(f"({file.stat().st_size} bytes)")
                        else:
                            st.info("No files found in output directory")
                    else:
                        st.error("Output directory doesn't exist")

                with tab5:
                    st.subheader("Download Files")
                    col1, col2 = st.columns(2)

                    with col1:
                        if html_content:
                            st.download_button(
                                label="📄 Download HTML",
                                data=html_content,
                                file_name="index.html",
                                mime="text/html",
                                use_container_width=True,
                            )
                        else:
                            st.warning("No HTML content to download")

                    with col2:
                        if css_content:
                            st.download_button(
                                label="🎨 Download CSS",
                                data=css_content,
                                file_name="styles.css",
                                mime="text/css",
                                use_container_width=True,
                            )
                        else:
                            st.warning("No CSS content to download")

            except Exception as e:
                st.error(f"❌ Conversion failed: {str(e)}")

    # Footer
    st.markdown("---")
    st.markdown(
        """
    <div style='text-align: center; color: #666;'>
        <a href='https://github.com/NandishDPatel/figma-design-to-code' target='_blank'>GitHub</a>
    </div>
    """,
        unsafe_allow_html=True,
    )


if __name__ == "__main__":
    main()
