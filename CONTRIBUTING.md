# SubKit Contributor Guide

Excited about SubKit and want to make it better? We’re excited too!

SubKit is build for developers just like you, striving to create tools and libraries around GraphQL. We welcome anyone who wants to contribute or provide constructive feedback, no matter the level of experience. If you want to help but don't know where to start, let us know, and we'll find something for you.

Here are some ways to contribute to the project, from easiest to most difficult:

* [Reporting bugs](#reporting-bugs)
* [Improving the documentation](#improving-the-documentation)
* [Responding to issues](#responding-to-issues)
* [Bug fixes](#bug-fixes)
* [Suggesting features](#suggesting-features)

## Issues

### Reporting bugs

If you encounter a bug, please file an issue on GitHub via the repository. If an issue you have is already reported, please add additional information or add a 👍 reaction to indicate your agreement.

While we will try to be as helpful as we can on any issue reported, please include the following to maximize the chances of a quick fix:

1. **Intended outcome:** What you were trying to accomplish when the bug occurred, and as much code as possible related to the source of the problem.
2. **Actual outcome:** A description of what actually happened, including a screenshot or copy-paste of any related error messages, logs, or other output that might be related.
3. **How to reproduce the issue:** Instructions for how the issue can be reproduced by a maintainer or contributor.

Creating a good reproduction really helps contributors investigate and resolve your issue quickly.

### Improving the documentation

Improving the documentation, examples, and other open source content can be the easiest way to contribute to the library. If you see a piece of content that can be better, open a PR with an improvement, no matter how small! If you would like to suggest a big change or major rewrite, we’d love to hear your ideas but please open an issue for discussion before writing the PR.

### Responding to issues

In addition to reporting issues, a great way to contribute to SubKit is to respond to other peoples' issues and try to identify the problem or help them work around it. If you’re interested in taking a more active role in this process, please go ahead and respond to issues.

### Bug fixes

For a bug fix change (less than 30 lines of code changed), feel free to open a pull request. We’ll try to merge it as fast as possible and ideally publish a new release on the same day. The only requirement is, make sure you also add a test that verifies the bug you are trying to fix.

### Suggesting features

Most of the features in SubKit came from suggestions by you! We welcome any ideas about how to make SubKit better for your use case.

### Code review guidelines

Here are some things we look for:

1. **Required CI checks pass.** This is a prerequisite for the review, and it is the PR author's responsibility.
2. **Simplicity.** If there are too many files, redundant functions, or complex lines of code, suggest a simpler way to do the same thing. In particular, avoid implementing an overly general solution when a simple, small, and pragmatic fix will do.
3. **Testing.** Do the tests ensure this code won’t break when other stuff changes.
4. **No unnecessary or unrelated changes.** PRs shouldn’t come with random formatting changes, especially in unrelated parts of the code.
5. **Code has appropriate comments.** Code should be commented, or written in a clear “self-documenting” way.

## New contributors

If you want to contribute to SubKit GraphQL-Server, but aren't quite sure where to start, take a look at the [roadmap and design docs](docs/ROADMAP.md). Just pick one of the upcoming features that you're interested in, and start working on it. If the design doc isn't clear enough (which it probably won't be), open an issue thread so we can discuss it.